import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { formatFullName } from "@/lib/shared/settings";
import { auth } from '@/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require authentication to access candidate profiles
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Only allow the candidate themselves, professionals they've booked with, or admins
  const isOwnProfile = session.user.id === params.id;
  const isAdmin = session.user.role === 'ADMIN';

  let hasBookingRelationship = false;
  if (!isOwnProfile && !isAdmin && session.user.role === 'PROFESSIONAL') {
    // Check if professional has a booking with this candidate
    const booking = await prisma.booking.findFirst({
      where: {
        candidateId: params.id,
        professionalId: session.user.id,
        status: { in: ['accepted', 'completed', 'completed_pending_feedback'] },
      },
    });
    hasBookingRelationship = !!booking;
  }

  if (!isOwnProfile && !isAdmin && !hasBookingRelationship) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

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
