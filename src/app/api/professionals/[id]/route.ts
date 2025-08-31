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
      role: e.role,
      company: e.company,
      period: e.period ?? undefined,
    })),
    education: pro.education.map((e) => ({
      school: e.school,
      degree: e.degree,
      period: e.period ?? undefined,
    })),
    interests: pro.interests,
    activities: pro.activities,
  };

  if (reveal) {
    payload.identity = { name: 'Revealed User', email: 'pro@example.com' };
  } else {
    payload.identity = { redacted: true };
  }

  return NextResponse.json(payload);
}

