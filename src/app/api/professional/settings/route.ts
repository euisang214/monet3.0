import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/core/api-helpers';
import { prisma } from "@/lib/core/db";
import { parseFullName, formatFullName, deleteUserAccount } from '@/lib/shared/settings';

async function fetchSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { professionalProfile: true },
  });
  if (!user) return null;
  const timezone = user.timezone;
  const verified =
    user.corporateEmailVerified || !!user.professionalProfile?.verifiedAt;
  const fullName = formatFullName(user.firstName, user.lastName);
  return { name: fullName, email: user.email, timezone, verified };
}

export const GET = withAuth(async (session) => {
  const data = await fetchSettings(session.user.id);
  return NextResponse.json(data);
});

export const PUT = withAuth(async (session, req: Request) => {
  const { name = '', email = '', timezone = '' } = await req.json();
  const { firstName, lastName } = parseFullName(name);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { firstName, lastName, email, timezone },
  });
  const data = await fetchSettings(session.user.id);
  return NextResponse.json(data);
});

export const DELETE = withAuth(async (session) => {
  await deleteUserAccount(session.user.id);
  return NextResponse.json({ ok: true });
});


