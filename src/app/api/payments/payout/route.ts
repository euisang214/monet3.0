import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { releaseEscrowToProfessional } from '@/lib/payments/stripe';
import { requireRole } from '@/lib/auth/rbac';
import { z } from 'zod';

const payoutSchema = z.object({
  bookingId: z.string(),
});

/**
 * POST /api/payments/payout
 * Admin-only endpoint to release funds to professional after QC passes
 */
export async function POST(req: NextRequest) {
  try {
    // Only admins can trigger payouts
    await requireRole(['ADMIN']);

    const body = await req.json();
    const parsed = payoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'validation_error', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { bookingId } = parsed.data;

    // Verify booking exists and is in completed state
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        professional: true,
        feedback: true,
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'booking_not_found' },
        { status: 404 }
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'booking_not_completed', currentStatus: booking.status },
        { status: 400 }
      );
    }

    // Verify QC has passed
    if (booking.feedback?.qcStatus !== 'passed') {
      return NextResponse.json(
        {
          error: 'qc_not_passed',
          qcStatus: booking.feedback?.qcStatus || 'missing'
        },
        { status: 400 }
      );
    }

    // Verify payment exists and is held
    if (!booking.payment || booking.payment.status !== 'held') {
      return NextResponse.json(
        {
          error: 'payment_not_held',
          paymentStatus: booking.payment?.status || 'missing'
        },
        { status: 400 }
      );
    }

    // Verify professional has Stripe account
    if (!booking.professional.stripeAccountId) {
      return NextResponse.json(
        { error: 'professional_no_stripe_account' },
        { status: 400 }
      );
    }

    // Release funds to professional
    const transfer = await releaseEscrowToProfessional(
      bookingId,
      booking.professional.stripeAccountId
    );

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amount: transfer.amount / 100,
      currency: transfer.currency,
    });
  } catch (error: any) {
    console.error('Payout error:', error);

    if (error.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (error.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'internal_error', message: error.message },
      { status: 500 }
    );
  }
}
