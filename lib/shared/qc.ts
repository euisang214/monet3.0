import { prisma } from '@/lib/core/db';
import { enqueueNudges } from '@/lib/queues';

export type QCReport = {
  wordCountOk: boolean;
  hasThreeActions: boolean;
  rubricComplete: boolean;
  clarityScore: number;
  notes: string[];
}

export type BasicValidationResult = {
  valid: boolean;
  errors: string[];
  wordCount: number;
}

/**
 * Centralized basic validation for feedback text and actions
 * Used across submission, pre-flight validation, and background QC
 */
export function validateFeedbackBasics(text: string, actions: string[]): BasicValidationResult {
  const errors: string[] = [];
  const wordCount = String(text || '').trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < 200) {
    errors.push(`Feedback is too short (${wordCount} words). Minimum 200 words required.`);
  }

  // Check for exactly 3 non-empty actions (Issue #4 & #12)
  const validActions = Array.isArray(actions) ? actions.filter(a => a && a.trim().length > 0) : [];
  if (validActions.length !== 3) {
    errors.push(`Exactly 3 non-empty action items required. You provided ${validActions.length}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    wordCount,
  };
}

export function evaluateFeedback(text: string, actions: string[]): QCReport{
  const validation = validateFeedbackBasics(text, actions);
  const clarityScore = Math.min(100, Math.round(validation.wordCount / 4));

  return {
    wordCountOk: validation.wordCount >= 200,
    hasThreeActions: Array.isArray(actions) && actions.filter(a => a && a.trim().length > 0).length === 3,
    rubricComplete: true, // stars validated at API
    clarityScore,
    notes: validation.errors,
  };
}

export async function qcAndGatePayout(bookingId: string){
  const fb = await prisma.callFeedback.findUnique({ where: { bookingId } });
  if(!fb) return;

  // Use same validation logic as submission (Issue #4)
  const validation = validateFeedbackBasics(fb.text, fb.actions);
  // Use correct Prisma field names (not database column names)
  const starsValid = fb.contentRating > 0 && fb.deliveryRating > 0 && fb.valueRating > 0;
  const pass = validation.valid && starsValid;

  await prisma.callFeedback.update({
    where: { bookingId }, data: { qcStatus: pass ? 'passed' : 'revise', qcReport: {} }
  });

  // On pass, create payout if not exists (Issue #6)
  if(pass){
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { professional: true, payment: true },
    });

    if (booking?.professional?.stripeAccountId && booking?.payment) {
      // Create payout record
      const existingPayout = await prisma.payout.findUnique({ where: { bookingId } });
      if (!existingPayout) {
        const platformFee = booking.payment.platformFee;
        const amountNet = booking.payment.amountGross - platformFee;
        await prisma.payout.create({
          data: {
            bookingId,
            proStripeAccountId: booking.professional.stripeAccountId,
            amountNet,
            status: 'pending',
          },
        });
      } else {
        // Update existing payout to pending
        await prisma.payout.update({
          where: { bookingId },
          data: { status: 'pending' },
        });
      }
    }
  } else {
    // On revise, enqueue nudge emails at +24h, +48h, +72h
    await enqueueNudges(bookingId);
  }
}
