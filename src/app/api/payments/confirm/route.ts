import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { stripe } from '../../../../../lib/payments/stripe';
import { auth } from '../../../../../auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { paymentIntentId } = await req.json();
  if (!paymentIntentId)
    return NextResponse.json({ error: 'missing_payment_intent' }, { status: 400 });

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded')
    return NextResponse.json({ error: 'not_succeeded' }, { status: 400 });

  const bookingId = (pi.metadata as any)?.bookingId as string | undefined;
  if (!bookingId)
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking || booking.candidateId !== session.user.id)
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  if (!booking.payment || booking.payment.escrowHoldId !== paymentIntentId)
    return NextResponse.json({ error: 'payment_mismatch' }, { status: 400 });

  return NextResponse.json({ ok: true, bookingId });
}

