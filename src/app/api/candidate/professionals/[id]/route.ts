import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // This endpoint doesn't require auth - it's public for browsing
  // However, session is checked to determine if user has booked before (for identity reveal)
  const { auth } = await import('@/auth');
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
    orderBy: { submittedAt: 'desc' },
  });
  payload.reviews = reviews.map((r) => ({
    rating: r.rating,
    text: r.text,
    submittedAt: r.submittedAt,
  }));

  if (reveal) {
    payload.identity = { name: 'Revealed User', email: 'pro@example.com' };
  } else {
    payload.identity = { redacted: true };
  }

  return NextResponse.json(payload);
}

