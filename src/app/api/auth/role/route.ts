import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { role: true }
  });
  return NextResponse.json({ role: user?.role ?? null });
}
