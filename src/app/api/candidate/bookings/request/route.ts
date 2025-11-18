import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { rateLimit } from '@/lib/core/rate-limit';
import { withAuth } from '@/lib/core/api-helpers';
import { sendEmail } from '@/lib/integrations/email';
import type { TimeSlot } from '@/lib/shared/time-slot';
import { toUtcDateRange, resolveTimezone, normalizeSlots } from '@/lib/shared/time-slot';

export const POST = withAuth(async (session, req: NextRequest) => {
  if (!rateLimit(`req:${session.user.id}`)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const body = await req.json();
  const { professionalId } = body;
  if (typeof professionalId !== 'string' || !professionalId) {
    return NextResponse.json({ error: 'invalid_professional' }, { status: 400 });
  }

  // Parallelize database queries for better performance
  const [candidate, pro, proUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    }),
    prisma.professionalProfile.findUnique({
      where: { userId: professionalId },
      select: { priceUSD: true },
    }),
    prisma.user.findUnique({
      where: { id: professionalId },
      select: { email: true },
    }),
  ]);

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
  if (proUser?.email) {
    await sendEmail({
      to: proUser.email,
      subject: 'New booking request',
      text: `You have a new booking request from ${session.user.email}.`,
    });
  }
  return NextResponse.json({ id: booking.id, status: booking.status, priceUSD: booking.priceUSD });
});
