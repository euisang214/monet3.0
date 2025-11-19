import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { sendEmail } from '@/lib/integrations/email';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { rateLimitAuth } from '@/lib/core/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit by IP address
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  if (!rateLimitAuth(`forgot-password:${ip}`)) {
    // Return ok: true to prevent email enumeration
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => null);
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }
  const { email } = parsed.data;

  // Also rate limit by email
  if (!rateLimitAuth(`forgot-password:email:${email.toLowerCase()}`)) {
    return NextResponse.json({ ok: true });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: true });
  }
  const token = uuid();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    text: `Click the following link to reset your password: ${resetUrl}`,
  });
  return NextResponse.json({ ok: true });
}
