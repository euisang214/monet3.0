import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { refundPayment } from '@/lib/integrations/stripe';
import { withRole } from '@/lib/core/api-helpers';
import { API_ERRORS, createErrorResponse, notFoundError } from '@/lib/core/errors';

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
    return createErrorResponse(
      API_ERRORS.INVALID_QC_STATUS,
      400,
      { valid: ['passed', 'revise', 'failed', 'missing'] }
    );
  }

  const callFeedback = await prisma.callFeedback.findUnique({
    where: { bookingId: params.bookingId },
  });

  if (!callFeedback) {
    return notFoundError(API_ERRORS.FEEDBACK_NOT_FOUND);
  }

  // Update feedback QC status
  await prisma.callFeedback.update({
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
      return createErrorResponse(
        API_ERRORS.REFUND_FAILED,
        500,
        { message: (error as Error).message }
      );
    }
  }

  return NextResponse.json({
    message: 'QC status updated successfully',
    qcStatus,
  });
});
