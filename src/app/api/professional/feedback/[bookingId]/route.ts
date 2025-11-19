import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { withAuth } from '@/lib/core/api-helpers';
import { notFoundError, forbiddenError, validationError } from '@/lib/core/errors';

export const GET = withAuth(async (session, _req: NextRequest, { params }: { params: { bookingId: string } }) => {

  const fb = await prisma.callFeedback.findUnique({
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
  if (!fb) return notFoundError();

  if (
    fb.booking.candidateId !== session.user.id &&
    fb.booking.professionalId !== session.user.id
  ) {
    return forbiddenError();
  }

  return NextResponse.json(fb);
});

export const POST = withAuth(async (session, req: NextRequest, { params }:{params:{bookingId:string}}) => {
  // First verify booking ownership (Issue #8)
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: { professionalId: true },
  });

  if (!booking) {
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
  }

  if (booking.professionalId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const data = await req.json();
  const { contentRating, deliveryRating, valueRating, actions, text, extraCategoryRatings } = data;

  // Use centralized validation
  const { validateFeedbackBasics } = await import('@/lib/shared/qc');
  const validation = validateFeedbackBasics(text, actions);
  if (!validation.valid) {
    return validationError({ details: validation.errors });
  }
  const wordCount = validation.wordCount;
  const fb = await prisma.callFeedback.upsert({
    where: { bookingId: params.bookingId },
    update: { contentRating, deliveryRating, valueRating, actions, text, wordCount, extraCategoryRatings, submittedAt: new Date(), qcStatus: 'revise' },
    create: { bookingId: params.bookingId, contentRating, deliveryRating, valueRating, actions, text, wordCount, extraCategoryRatings, submittedAt: new Date(), qcStatus: 'revise' },
  });

  // Update booking status to 'completed' (Issue #1)
  await prisma.booking.update({
    where: { id: params.bookingId },
    data: { status: 'completed' },
  });

  // Enqueue QC
  const { enqueueFeedbackQC } = await import('@/lib/queues');
  await enqueueFeedbackQC(params.bookingId);
  return NextResponse.json({ ok: true, callFeedback: fb });
});
