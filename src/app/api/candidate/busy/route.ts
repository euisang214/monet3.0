import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getBusyTimes } from '../../../../../lib/calendar/google';
import { prisma } from '../../../../../lib/db';
import {
  convertTimeSlotsTimezone,
  createTimeSlotFromDates,
  mergeSlots,
  resolveTimezone,
  splitIntoSlots,
  toUtcDateRange,
  TimeSlot,
} from '../../../../../lib/availability';

export async function GET(){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    const busyFromGoogle = await getBusyTimes(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });
    const timezone = resolveTimezone(user?.timezone);

    const existing = await prisma.availability.findMany({
      where: { userId: session.user.id },
      orderBy: { start: 'asc' },
    });

    const toSlot = (row: { start: Date; end: Date; timezone: string }) =>
      createTimeSlotFromDates(row.start, row.end, row.timezone);

    const existingAvailable = existing
      .filter((row) => !row.busy)
      .map(toSlot);
    const existingBusy = existing
      .filter((row) => row.busy)
      .map(toSlot);

    const existingBusySlots = splitIntoSlots(existingBusy);
    const incomingBusySlots = splitIntoSlots(busyFromGoogle);
    const collectKey = (slot: TimeSlot) => toUtcDateRange(slot).start.getTime();

    const finalBusy = mergeSlots([...existingBusySlots, ...incomingBusySlots]);
    const finalBusyKeys = new Set<number>(
      splitIntoSlots(finalBusy).map((slot) => collectKey(slot)),
    );

    const finalAvailable = mergeSlots(
      splitIntoSlots(existingAvailable).filter(
        (slot) => !finalBusyKeys.has(collectKey(slot)),
      ),
    );

    await prisma.availability.deleteMany({ where: { userId: session.user.id } });
    const toRows = (slots: TimeSlot[], busy: boolean) =>
      slots.map((slot) => {
        const { start, end } = toUtcDateRange(slot);
        return {
          userId: session.user.id,
          start,
          end,
          busy,
          timezone: slot.timezone,
        };
      });

    const data = [...toRows(finalAvailable, false), ...toRows(finalBusy, true)];
    if (data.length) {
      await prisma.availability.createMany({ data });
    }

    const events = splitIntoSlots(convertTimeSlotsTimezone(finalAvailable, timezone));
    const busy = splitIntoSlots(convertTimeSlotsTimezone(finalBusy, timezone));

    return NextResponse.json({ events, busy });
  }catch(err: any){
    if(err.message === 'NOT_AUTHENTICATED'){
      return NextResponse.json({ error: 'google_auth_required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'failed_to_fetch' }, { status: 500 });
  }
}