import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const schema = z.object({ token: z.string(), password: z.string().min(6) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const { token, password } = parsed.data;
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: record.userId }, data: { hashedPassword: hashed } });
  await prisma.passwordResetToken.delete({ where: { token } });
  return NextResponse.json({ ok: true });
}
