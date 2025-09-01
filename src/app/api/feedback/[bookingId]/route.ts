import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { auth } from '@/auth';
import { enqueueFeedbackQC } from '../../../../../lib/queues';

export async function GET(_req: NextRequest, { params }: { params: { bookingId: string } }) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const fb = await prisma.feedback.findUnique({
    where: { bookingId: params.bookingId },
    include: {
      booking: { select: { candidateId: true, professionalId: true } },
    },
  });
  if (!fb) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (
    fb.booking.candidateId !== session.user.id &&
    fb.booking.professionalId !== session.user.id
  ) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { booking, ...rest } = fb as any;
  return NextResponse.json(rest);
}

export async function POST(req: NextRequest, { params }:{params:{bookingId:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const data = await req.json();
  const { starsCategory1, starsCategory2, starsCategory3, actions, text, extraCategoryRatings } = data;
  const wordCount = String(text||'').trim().split(/\s+/).filter(Boolean).length;
  if(wordCount < 200) return NextResponse.json({error:'min_words'}, {status:400});
  if(!Array.isArray(actions) || actions.length !== 3) return NextResponse.json({error:'need_three_actions'}, {status:400});
  const fb = await prisma.feedback.upsert({
    where: { bookingId: params.bookingId },
    update: { starsCategory1, starsCategory2, starsCategory3, actions, text, wordCount, extraCategoryRatings, submittedAt: new Date(), qcStatus: 'revise' },
    create: { bookingId: params.bookingId, starsCategory1, starsCategory2, starsCategory3, actions, text, wordCount, extraCategoryRatings, submittedAt: new Date(), qcStatus: 'revise' },
  });
  // Enqueue QC
  await enqueueFeedbackQC(params.bookingId);
  return NextResponse.json({ ok: true, feedback: fb });
}
