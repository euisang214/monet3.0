import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { formatFullName } from "@/lib/shared/settings";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      candidateProfile: {
        include: { experience: true, education: true },
      },
    },
  });
  const profile = user?.candidateProfile;
  if (!user || !profile) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const payload: any = {
    identity: {
      name: formatFullName(user.firstName, user.lastName) || undefined,
      email: user.email,
    },
    resumeUrl: profile.resumeUrl,
    interests: profile.interests,
    activities: profile.activities,
    experience: profile.experience.map((e) => ({
      firm: e.firm,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    education: profile.education.map((e) => ({
      school: e.school,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
  };
  return NextResponse.json(payload);
}
