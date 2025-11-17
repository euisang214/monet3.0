import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/core/api-helpers';
import { prisma } from "@/lib/core/db";

export const GET = withAuth(async (session) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { corporateEmailVerified: true },
  });
  return NextResponse.json({ verified: !!user?.corporateEmailVerified });
});
