import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import {
  createTimeSlotFromDates,
  convertTimeSlotsTimezone,
  resolveTimezone,
} from '../../../../../../lib/availability';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    select: {
      professionalId: true,
      candidate: {
        select: {
          availabilities: {
            orderBy: { start: 'asc' },
          },
        },
      },
      professional: {
        select: { timezone: true },
      },
    },
  });

  if (!booking || booking.professionalId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const targetTimezone = resolveTimezone(booking.professional?.timezone);
  const candidateAvailability = booking.candidate?.availabilities ?? [];

  const availableSlots = convertTimeSlotsTimezone(
    candidateAvailability
      .filter((row) => !row.busy)
      .map((row) => createTimeSlotFromDates(row.start, row.end, row.timezone)),
    targetTimezone,
  );

  const busySlots = convertTimeSlotsTimezone(
    candidateAvailability
      .filter((row) => row.busy)
      .map((row) => createTimeSlotFromDates(row.start, row.end, row.timezone)),
    targetTimezone,
  );

  return NextResponse.json({ availability: availableSlots, busy: busySlots });
}
