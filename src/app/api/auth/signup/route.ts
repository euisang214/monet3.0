import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['CANDIDATE', 'PROFESSIONAL']),
    timezone: z.string()
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Choose a role; minimum 6 character password' }, { status: 400 });
  }
  const { email, password, role, timezone } = parsed.data;
  if (!Intl.supportedValuesOf('timeZone').includes(timezone)) {
    return NextResponse.json({ error: 'invalid_timezone' }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'email_in_use' }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, hashedPassword, role, timezone } });
  return NextResponse.json({ ok: true });
}
