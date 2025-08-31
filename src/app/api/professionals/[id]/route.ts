import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { auth } from '../../../../../auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const pro = await prisma.professionalProfile.findUnique({
    where: { userId: params.id },
    include: { experience: true, education: true },
  });
  if (!pro) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let reveal = false;
  if (session?.user) {
    const booked = await prisma.booking.findFirst({
      where: {
        professionalId: params.id,
        candidateId: session.user.id,
        status: { in: ['accepted', 'completed', 'completed_pending_feedback'] },
      },
    });
    reveal = !!booked;
  }

  const payload: any = {
    employer: pro.employer,
    title: pro.title,
    priceUSD: pro.priceUSD,
    tags: [],
    verified: !!pro.verifiedAt,
    bio: pro.bio,
    experience: pro.experience.map((e) => ({
      firm: e.firm,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    education: pro.education.map((e) => ({
      school: e.school,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    interests: pro.interests,
    activities: pro.activities,
  };

  const reviews = await prisma.professionalReview.findMany({
    where: { booking: { professionalId: params.id } },
    include: { booking: { include: { candidate: true } } },
    orderBy: { submittedAt: 'desc' },
  });
  payload.reviews = reviews.map((r) => ({
    rating: r.rating,
    text: r.text,
    candidate: r.booking.candidate.email,
    submittedAt: r.submittedAt,
  }));

  if (reveal) {
    payload.identity = { name: 'Revealed User', email: 'pro@example.com' };
  } else {
    payload.identity = { redacted: true };
  }

  return NextResponse.json(payload);
}

