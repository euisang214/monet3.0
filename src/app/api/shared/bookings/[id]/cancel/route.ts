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
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });

    // Process refund
    try {
      await refundPayment(booking.id);
      return NextResponse.json({
        message: 'Booking cancelled and refund processed',
        refundRule: 'full_refund'
      });
    } catch (error) {
      console.error('Refund failed:', error);
      return createErrorResponse(
        API_ERRORS.REFUND_FAILED,
        500,
        { message: (error as Error).message }
      );
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
  await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });

  // Process refund
  try {
    await refundPayment(booking.id);
    return NextResponse.json({
      message: 'Booking cancelled and refund processed',
      refundRule: 'full_refund'
    });
  } catch (error) {
    console.error('Refund failed:', error);
    return createErrorResponse(
      API_ERRORS.REFUND_FAILED,
      500,
      { message: (error as Error).message }
    );
  }
});
