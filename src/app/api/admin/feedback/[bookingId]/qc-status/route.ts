import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { refundPayment } from '@/lib/integrations/stripe';
import { withRole } from '@/lib/core/api-helpers';

/**
 * Admin endpoint to manually update feedback QC status
 * When status is set to 'failed', automatically triggers refund and blocks payout
 */
export const PUT = withRole(['ADMIN'], async (
  session,
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) => {

  const body = await req.json();
  const { qcStatus, reason } = body;

  // Validate qcStatus
  if (!['passed', 'revise', 'failed', 'missing'].includes(qcStatus)) {
    return NextResponse.json(
      { error: 'invalid_qc_status', valid: ['passed', 'revise', 'failed', 'missing'] },
      { status: 400 }
    );
  }

  const feedback = await prisma.feedback.findUnique({
    where: { bookingId: params.bookingId },
  });

  if (!feedback) {
    return NextResponse.json({ error: 'feedback_not_found' }, { status: 404 });
  }

  // Update feedback QC status
  await prisma.feedback.update({
    where: { bookingId: params.bookingId },
    data: {
      qcStatus,
      qcReport: { adminOverride: true, reason: reason || 'Admin manual update' },
    },
  });

  // Handle different QC statuses
  if (qcStatus === 'passed') {
    // Mark payout as pending (ready for professional)
    await prisma.payout.updateMany({
      where: { bookingId: params.bookingId },
      data: { status: 'pending' },
    });
  } else if (qcStatus === 'failed') {
    // Auto-refund to candidate and block payout
    try {
      await refundPayment(params.bookingId);
      return NextResponse.json({
        message: 'QC status updated to failed, refund processed, and payout blocked',
        qcStatus,
      });
    } catch (error) {
      console.error('Failed to process refund:', error);
      return NextResponse.json(
        { error: 'refund_failed', message: (error as Error).message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    message: 'QC status updated successfully',
    qcStatus,
  });
});
