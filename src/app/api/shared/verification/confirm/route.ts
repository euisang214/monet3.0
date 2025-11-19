import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { getAppUrl } from '@/lib/integrations/email-templates';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const appUrl = getAppUrl();

  if (!token) {
    return NextResponse.redirect(`${appUrl}/verify-email?error=missing_token`);
  }

  // Find verification record
  const verification = await prisma.verification.findFirst({
    where: { token },
  });

  if (!verification) {
    return NextResponse.redirect(`${appUrl}/verify-email?error=invalid_token`);
  }

  // Check if already verified
  if (verification.verifiedAt) {
    return NextResponse.redirect(`${appUrl}/verify-email?status=already_verified`);
  }

  // Check if token has expired
  if (verification.expiresAt < new Date()) {
    return NextResponse.redirect(`${appUrl}/verify-email?error=expired_token`);
  }

  // Mark user as verified
  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { corporateEmailVerified: true },
    }),
    prisma.verification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    }),
  ]);

  // Redirect to success page
  return NextResponse.redirect(`${appUrl}/verify-email?status=success`);
}
