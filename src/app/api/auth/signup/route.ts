import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimitAuth } from '@/lib/core/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit by IP address
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  if (!rateLimitAuth(`signup:${ip}`)) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['CANDIDATE', 'PROFESSIONAL'])
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Choose a role; minimum 6 character password' }, { status: 400 });
  }
  const { email, password, role } = parsed.data;

  // Also rate limit by email to prevent enumeration
  if (!rateLimitAuth(`signup:email:${email.toLowerCase()}`)) {
    return NextResponse.json(
      { error: 'Too many signup attempts for this email. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'email_in_use' }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, hashedPassword, role } });
  return NextResponse.json({ ok: true });
}
