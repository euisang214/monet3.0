import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { withAuth } from '@/lib/core/api-helpers';
import { sendEmail } from '@/lib/integrations/email';
import crypto from 'crypto';

export const POST = withAuth(async (session, req: NextRequest) => {
  const { corporateEmail } = await req.json();
  // Use cryptographically secure token instead of Math.random()
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.verification.create({
    data: { userId: session.user.id, corporateEmail, token },
  });
  await sendEmail({
    to: corporateEmail,
    subject: 'Verify your corporate email',
    text: `Click: ${process.env.APP_URL}/api/verification/confirm?token=${token}`,
  });
  return NextResponse.json({ ok: true });
});
