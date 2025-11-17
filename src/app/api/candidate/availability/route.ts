import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from "@/lib/core/db";
import type { TimeSlot } from '../../../../../lib/availability';
import {
  mergeSlots,
  splitIntoSlots,
  createTimeSlotFromDates,
  convertTimeSlotsTimezone,
  toUtcDateRange,
  resolveTimezone,
  normalizeSlots,
} from '../../../../../lib/availability';

export async function POST(req: Request){
  const session = await auth();
  if(!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { events = [], busy = [] } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { timezone: true } });
  const fallbackTimezone = resolveTimezone(user?.timezone);

  let mergedEvents: TimeSlot[] = [];
  let mergedBusy: TimeSlot[] = [];
  try {
    mergedEvents = mergeSlots(normalizeSlots(events, fallbackTimezone));
    mergedBusy = mergeSlots(normalizeSlots(busy, fallbackTimezone));
  } catch (err) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const existing = await prisma.availability.findMany({
    where: { userId: session.user.id },
    orderBy: { start: 'asc' },
  });

  const toSlot = (row: { start: Date; end: Date; timezone: string }) =>
    createTimeSlotFromDates(row.start, row.end, row.timezone);

  const existingBusy = existing.filter((row) => row.busy).map(toSlot);
  const existingBusySlots = splitIntoSlots(existingBusy);
  const incomingBusySlots = splitIntoSlots(mergedBusy);
  const collectKey = (slot: TimeSlot) => toUtcDateRange(slot).start.getTime();

  const finalBusy = mergeSlots([...existingBusySlots, ...incomingBusySlots]);
  const finalBusyKeys = new Set<number>(splitIntoSlots(finalBusy).map((slot) => collectKey(slot)));

  const filteredEventSlots = splitIntoSlots(mergedEvents).filter(
    (slot) => !finalBusyKeys.has(collectKey(slot)),
  );
  const finalEvents = mergeSlots(filteredEventSlots);

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

  await prisma.availability.deleteMany({ where: { userId: session.user.id, busy: false } });
  const availableRows = toRows(finalEvents, false);
  if (availableRows.length) {
    await prisma.availability.createMany({ data: availableRows });
  }

  await prisma.availability.deleteMany({ where: { userId: session.user.id, busy: true } });
  const busyRows = toRows(finalBusy, true);
  if (busyRows.length) {
    await prisma.availability.createMany({ data: busyRows });
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
  const events = splitIntoSlots(
    convertTimeSlotsTimezone(
      availability.filter((r) => !r.busy).map((r) => r.slot),
      timezone,
    ),
  );
  const busy = splitIntoSlots(
    convertTimeSlotsTimezone(
      availability.filter((r) => r.busy).map((r) => r.slot),
      timezone,
    ),
  );
  return NextResponse.json({ events, busy });
}
