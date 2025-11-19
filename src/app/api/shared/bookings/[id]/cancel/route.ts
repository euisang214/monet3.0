import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { differenceInMinutes } from 'date-fns';
import { withAuth } from '@/lib/core/api-helpers';
import { refundPayment } from '@/lib/integrations/stripe';
import { API_ERRORS, notFoundError, forbiddenError, createErrorResponse } from '@/lib/core/errors';

export const POST = withAuth(async (session, req: NextRequest, { params }:{params:{id:string}}) => {
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if(!booking) return notFoundError();

  const actor = session.user.id === booking.candidateId ? 'candidate' : (session.user.id === booking.professionalId ? 'professional' : 'none');
  if(actor === 'none') return forbiddenError();

  // Check 3-hour cancellation window
  const minutesUntilCall = (booking.startAt.getTime() - Date.now()) / 60000;

  // Professional can cancel anytime with full refund
  if(actor === 'professional'){
    // Process refund only if payment exists (Issue #2)
    const payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    if (payment) {
      try {
        // Use transaction to ensure atomic operation - refund first, then update booking
        await refundPayment(booking.id);
        await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
        return NextResponse.json({
          message: 'Booking cancelled and refund processed',
          refundRule: 'full_refund'
        });
      } catch (error) {
        console.error('Refund failed:', error);
        return NextResponse.json(
          { error: 'refund_failed', message: (error as Error).message },
          { status: 500 }
        );
      }
    } else {
      // No payment made yet, just cancel
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
      return NextResponse.json({
        message: 'Booking cancelled (no payment to refund)',
        refundRule: 'no_payment'
      });
    }
  }

  // Candidate cancellation policy
  if (minutesUntilCall < 180) {
    // Cannot cancel within 3 hours
    return createErrorResponse(
      API_ERRORS.LATE_CANCELLATION,
      400,
      { message: 'Cannot cancel within 3 hours of scheduled call time' }
    );
  }

  // More than 3 hours - allow cancellation with full refund
  // Process refund only if payment exists (Issue #2)
  const payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
  if (payment) {
    try {
      // Use transaction to ensure atomic operation - refund first, then update booking
      await refundPayment(booking.id);
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
      return NextResponse.json({
        message: 'Booking cancelled and refund processed',
        refundRule: 'full_refund'
      });
    } catch (error) {
      console.error('Refund failed:', error);
      return NextResponse.json(
        { error: 'refund_failed', message: (error as Error).message },
        { status: 500 }
      );
    }
  } else {
    // No payment made yet, just cancel
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
    return NextResponse.json({
      message: 'Booking cancelled (no payment to refund)',
      refundRule: 'no_payment'
    });
  }
});
