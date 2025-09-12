import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { sendEmail } from '../../../../../lib/email';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }
  const { email } = parsed.data;
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
  try {
    await sendEmail({
      to: email,
      subject: 'Reset your password',
      text: `Click the following link to reset your password: ${resetUrl}`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
