import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { rateLimit } from '../../../../../lib/rate-limit';
import { auth } from '@/auth';
import { sendEmail } from '../../../../../lib/email';
import type { TimeSlot } from '../../../../../lib/availability';
import { toUtcDateRange, resolveTimezone, normalizeSlots } from '../../../../../lib/availability';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!rateLimit(`req:${session.user.id}`)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const body = await req.json();
  const { professionalId } = body;
  if (typeof professionalId !== 'string' || !professionalId) {
    return NextResponse.json({ error: 'invalid_professional' }, { status: 400 });
  }

  const candidate = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const fallbackTimezone = resolveTimezone(candidate?.timezone);
  const rawSlots = Array.isArray(body.slots) ? body.slots : [];
  let slots: TimeSlot[];
  try {
    slots = normalizeSlots(rawSlots, fallbackTimezone);
  } catch {
    return NextResponse.json({ error: 'invalid_slots' }, { status: 400 });
  }

  const slotRanges = slots
    .map((slot) => ({ slot, range: toUtcDateRange(slot) }))
    .sort((a, b) => a.range.start.getTime() - b.range.start.getTime());

  const pro = await prisma.professionalProfile.findUnique({
    where: { userId: professionalId },
    select: { priceUSD: true },
  });

  const firstRange = slotRanges[0];

  const booking = await prisma.booking.create({
    data: {
      candidateId: session.user.id,
      professionalId,
      status: 'requested',
      startAt: firstRange ? firstRange.range.start : new Date(0),
      endAt: firstRange ? firstRange.range.end : new Date(0),
      timezone: firstRange ? firstRange.slot.timezone : fallbackTimezone,
      priceUSD: pro?.priceUSD ?? 0,
    },
  });

  const proUser = await prisma.user.findUnique({
    where: { id: professionalId },
    select: { email: true },
  });
  if (proUser?.email) {
    await sendEmail({
      to: proUser.email,
      subject: 'New booking request',
      text: `You have a new booking request from ${session.user.email}.`,
    });
  }
  return NextResponse.json({ id: booking.id, status: booking.status, priceUSD: booking.priceUSD });
}
