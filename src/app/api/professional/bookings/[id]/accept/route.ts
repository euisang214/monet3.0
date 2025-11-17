import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import {
  createTimeSlotFromDates,
  convertTimeSlotsTimezone,
  resolveTimezone,
} from '@/lib/shared/availability';
import { auth } from '@/auth';

export async function POST(_req: NextRequest, { params }:{params:{id:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if(!booking || booking.professionalId !== session.user.id) return NextResponse.json({error:'forbidden'}, {status:403});

  const [candidateAvailability, professional] = await Promise.all([
    prisma.availability.findMany({
      where: { userId: booking.candidateId, busy: false },
      orderBy: { start: 'asc' },
    }),
    prisma.user.findUnique({
      where: { id: booking.professionalId },
      select: { timezone: true },
    }),
  ]);

  const targetTimezone = resolveTimezone(professional?.timezone);
  const availability = convertTimeSlotsTimezone(
    candidateAvailability.map((row) =>
      createTimeSlotFromDates(row.start, row.end, row.timezone),
    ),
    targetTimezone,
  );

  return NextResponse.json({ availability });
}
