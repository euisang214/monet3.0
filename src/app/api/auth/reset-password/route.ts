import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { rateLimitAuth } from '@/lib/core/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit by IP address to prevent token brute force
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  if (!rateLimitAuth(`reset-password:${ip}`)) {
    return NextResponse.json(
      { error: 'Too many reset attempts. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const schema = z.object({ token: z.string(), password: z.string().min(6) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const { token, password } = parsed.data;

  // Rate limit by token to prevent brute force
  if (!rateLimitAuth(`reset-password:token:${token}`)) {
    return NextResponse.json(
      { error: 'Too many reset attempts for this token.' },
      { status: 429 }
    );
  }
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: record.userId }, data: { hashedPassword: hashed } });
  await prisma.passwordResetToken.delete({ where: { token } });
  return NextResponse.json({ ok: true });
}
