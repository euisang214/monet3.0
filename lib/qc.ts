import { prisma } from '@/lib/db';

export type QCReport = {
  wordCountOk: boolean;
  hasThreeActions: boolean;
  rubricComplete: boolean;
  clarityScore: number;
  notes: string[];
}

export function evaluateFeedback(text: string, actions: string[]): QCReport{
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCountOk = words.length >= 200;
  const hasThreeActions = actions.filter(a=>a && a.trim().length>0).length === 3;
  const rubricComplete = true; // stars validated at API
  const clarityScore = Math.min(100, Math.round(words.length / 4));
  const notes: string[] = [];
  if(!wordCountOk) notes.push('Word count below 200.');
  if(!hasThreeActions) notes.push('Exactly three action items required.');
  return { wordCountOk, hasThreeActions, rubricComplete, clarityScore, notes };
}

export async function qcAndGatePayout(bookingId: string){
  const fb = await prisma.feedback.findUnique({ where: { bookingId } });
  if(!fb) return;
  const pass = fb.wordCount >= 200 && fb.actions.length === 3 && fb.starsCategory1>0 && fb.starsCategory2>0 && fb.starsCategory3>0;
  await prisma.feedback.update({
    where: { bookingId }, data: { qcStatus: pass ? 'passed' : 'revise', qcReport: {} }
  });
  // On pass, mark payout as ready
  if(pass){
    await prisma.payout.updateMany({ where:{ bookingId }, data: { status: 'pending' } });
  }
}
