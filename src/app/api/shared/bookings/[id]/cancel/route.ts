import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { differenceInMinutes } from 'date-fns';
import { auth } from '@/auth';
import { refundPayment } from '@/lib/integrations/stripe';

export async function POST(req: NextRequest, { params }:{params:{id:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if(!booking) return NextResponse.json({error:'not_found'}, {status:404});

  const actor = session.user.id === booking.candidateId ? 'candidate' : (session.user.id === booking.professionalId ? 'professional' : 'none');
  if(actor === 'none') return NextResponse.json({error:'forbidden'}, {status:403});

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
      return NextResponse.json(
        { error: 'refund_failed', message: (error as Error).message },
        { status: 500 }
      );
    }
  }

  // Candidate cancellation policy
  if (minutesUntilCall < 180) {
    // Cannot cancel within 3 hours
    return NextResponse.json(
      { error: 'late_cancellation', message: 'Cannot cancel within 3 hours of scheduled call time' },
      { status: 400 }
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
    return NextResponse.json(
      { error: 'refund_failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
