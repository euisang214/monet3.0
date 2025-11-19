import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/core/api-helpers';
import { prisma } from '@/lib/core/db';

export const POST = withAuth(async (session, _: Request, { params }:{params:{bookingId:string}}) => {
  // Validate booking exists and user has access
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: { professionalId: true, candidateId: true },
  });

  if (!booking) {
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
  }

  // Only allow the professional, candidate, or admin to trigger QC recheck
  const isAuthorized =
    session.user.role === 'ADMIN' ||
    session.user.id === booking.professionalId ||
    session.user.id === booking.candidateId;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { enqueueFeedbackQC } = await import('@/lib/queues');
  await enqueueFeedbackQC(params.bookingId);
  return NextResponse.json({ ok: true });
});
