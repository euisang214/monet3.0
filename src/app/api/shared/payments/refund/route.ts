import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { refundPayment } from '@/lib/integrations/stripe';
import { requireRole } from '@/lib/core/api-helpers';
import { z } from 'zod';

const refundSchema = z.object({
  bookingId: z.string(),
  reason: z.string().optional(),
});

/**
 * POST /api/payments/refund
 * Admin-only endpoint to refund a booking to the candidate
 * Typically used when QC fails or booking is cancelled
 */
export async function POST(req: NextRequest) {
  try {
    // Only admins can trigger refunds
    await requireRole(['ADMIN']);

    const body = await req.json();
    const parsed = refundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'validation_error', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { bookingId, reason } = parsed.data;

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        candidate: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'booking_not_found' },
        { status: 404 }
      );
    }

    // Verify payment exists
    if (!booking.payment) {
      return NextResponse.json(
        { error: 'payment_not_found' },
        { status: 404 }
      );
    }

    // Verify payment is not already refunded
    if (booking.payment.status === 'refunded') {
      return NextResponse.json(
        { error: 'already_refunded' },
        { status: 400 }
      );
    }

    // Verify payment is not already released
    if (booking.payment.status === 'released') {
      return NextResponse.json(
        { error: 'payment_already_released' },
        { status: 400 }
      );
    }

    // Process refund
    await refundPayment(bookingId);

    // Update booking status to refunded if not already cancelled
    if (booking.status !== 'cancelled') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'refunded' },
      });
    }

    // Log the refund reason if provided
    if (reason) {
      await prisma.auditLog.create({
        data: {
          action: 'refund_processed',
          actorUserId: booking.candidateId,
          metadata: {
            bookingId,
            reason,
            amount: booking.payment.amountGross / 100,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      bookingId,
      amount: booking.payment.amountGross / 100,
      currency: 'usd',
    });
  } catch (error: any) {
    console.error('Refund error:', error);

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
