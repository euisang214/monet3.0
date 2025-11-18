import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { withAuth } from '@/lib/core/api-helpers';

export const GET = withAuth(async (session, _req: NextRequest, { params }: { params: { bookingId: string } }) => {

  const fb = await prisma.feedback.findUnique({
    where: { bookingId: params.bookingId },
    include: {
      booking: {
        select: {
          candidateId: true,
          professionalId: true,
          candidate: { select: { firstName: true, lastName: true, email: true } },
          professional: {
            select: {
              firstName: true,
              lastName: true,
              professionalProfile: { select: { title: true, employer: true } },
            },
          },
        },
      },
    },
  });
  if (!fb) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (
    fb.booking.candidateId !== session.user.id &&
    fb.booking.professionalId !== session.user.id
  ) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  return NextResponse.json(fb);
});

export const POST = withAuth(async (session, req: NextRequest, { params }:{params:{bookingId:string}}) => {
  const data = await req.json();
  const { starsCategory1, starsCategory2, starsCategory3, actions, text, extraCategoryRatings } = data;

  // Use centralized validation
  const { validateFeedbackBasics } = await import('@/lib/shared/qc');
  const validation = validateFeedbackBasics(text, actions);
  if (!validation.valid) {
    return NextResponse.json({
      error: 'validation_error',
      details: validation.errors
    }, { status: 400 });
  }
  const wordCount = validation.wordCount;
  const fb = await prisma.feedback.upsert({
    where: { bookingId: params.bookingId },
    update: { starsCategory1, starsCategory2, starsCategory3, actions, text, wordCount, extraCategoryRatings, submittedAt: new Date(), qcStatus: 'revise' },
    create: { bookingId: params.bookingId, starsCategory1, starsCategory2, starsCategory3, actions, text, wordCount, extraCategoryRatings, submittedAt: new Date(), qcStatus: 'revise' },
  });
  // Enqueue QC
  const { enqueueFeedbackQC } = await import('@/lib/queues');
  await enqueueFeedbackQC(params.bookingId);
  return NextResponse.json({ ok: true, feedback: fb });
});
