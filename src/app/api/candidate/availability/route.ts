import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from "@/lib/core/db";
import type { TimeSlot } from '@/lib/shared/availability';
import {
  mergeSlots,
  createTimeSlotFromDates,
  convertTimeSlotsTimezone,
  toUtcDateRange,
  resolveTimezone,
  normalizeSlots,
} from '@/lib/shared/availability';

export async function POST(req: Request){
  const session = await auth();
  if(!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { events = [] } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { timezone: true } });
  const fallbackTimezone = resolveTimezone(user?.timezone);

  let mergedEvents: TimeSlot[] = [];
  try {
    mergedEvents = mergeSlots(normalizeSlots(events, fallbackTimezone));
  } catch (err) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const toRows = (slots: TimeSlot[], busyFlag: boolean) =>
    slots.map((slot) => {
      const { start, end } = toUtcDateRange(slot);
      return {
        userId: session.user.id,
        start,
        end,
        busy: busyFlag,
        timezone: slot.timezone,
      };
    });

  // Delete old available slots and insert new ones
  await prisma.availability.deleteMany({ where: { userId: session.user.id, busy: false } });
  const availableRows = toRows(mergedEvents, false);
  if (availableRows.length) {
    await prisma.availability.createMany({ data: availableRows });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(){
  const session = await auth();
  if(!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { timezone: true } });
  const timezone = resolveTimezone(user?.timezone);
  const rows = await prisma.availability.findMany({
    where: { userId: session.user.id },
    orderBy: { start: 'asc' },
  });
  const availability = rows.map((row) => ({
    slot: createTimeSlotFromDates(row.start, row.end, row.timezone),
    busy: row.busy,
  }));
  const events = convertTimeSlotsTimezone(
    availability.filter((r) => !r.busy).map((r) => r.slot),
    timezone,
  );
  const busy = convertTimeSlotsTimezone(
    availability.filter((r) => r.busy).map((r) => r.slot),
    timezone,
  );
  return NextResponse.json({ events, busy });
}
