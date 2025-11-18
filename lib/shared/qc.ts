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
export function validateFeedbackBasics(text: string, actions: any[]): BasicValidationResult {
  const errors: string[] = [];
  const wordCount = String(text || '').trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < 200) {
    errors.push(`Feedback is too short (${wordCount} words). Minimum 200 words required.`);
  }

  if (!Array.isArray(actions) || actions.length !== 3) {
    errors.push(`Exactly 3 action items required. You provided ${Array.isArray(actions) ? actions.length : 0}.`);
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
  const pass = fb.wordCount >= 200 && fb.actions.length === 3 && fb.contentRating>0 && fb.deliveryRating>0 && fb.valueRating>0;
  await prisma.callFeedback.update({
    where: { bookingId }, data: { qcStatus: pass ? 'passed' : 'revise', qcReport: {} }
  });
  // On pass, mark payout as ready
  if(pass){
    await prisma.payout.updateMany({ where:{ bookingId }, data: { status: 'pending' } });
  } else {
    // On revise, enqueue nudge emails at +24h, +48h, +72h
    await enqueueNudges(bookingId);
  }
}
