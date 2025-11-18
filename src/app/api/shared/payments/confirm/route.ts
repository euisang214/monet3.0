import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { stripe } from "@/lib/integrations/stripe";
import { withAuth } from '@/lib/core/api-helpers';
import { API_ERRORS, createErrorResponse, forbiddenError, notFoundError } from '@/lib/core/errors';

export const POST = withAuth(async (session, req: NextRequest) => {

  const { paymentIntentId } = await req.json();
  if (!paymentIntentId)
    return createErrorResponse(API_ERRORS.MISSING_PAYMENT_INTENT);

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded')
    return createErrorResponse(API_ERRORS.PAYMENT_NOT_SUCCEEDED);

  const bookingId = (pi.metadata as any)?.bookingId as string | undefined;
  if (!bookingId)
    return notFoundError(API_ERRORS.BOOKING_NOT_FOUND);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking || booking.candidateId !== session.user.id)
    return forbiddenError();

  if (!booking.payment || booking.payment.escrowHoldId !== paymentIntentId)
    return createErrorResponse(API_ERRORS.PAYMENT_MISMATCH);

  return NextResponse.json({ ok: true, bookingId });
});

