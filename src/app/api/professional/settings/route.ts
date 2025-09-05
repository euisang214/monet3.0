import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '../../../../../lib/db';

async function fetchSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { professionalProfile: true },
  });
  if (!user) return null;
  const flags: any = user.flags || {};
  const timezone = flags.timezone || '';
  const verified =
    user.corporateEmailVerified || !!user.professionalProfile?.verifiedAt;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return { name: fullName, email: user.email, timezone, verified };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const data = await fetchSettings(session.user.id);
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { name = '', email = '', timezone = '' } = await req.json();
  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');
  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { flags: true },
  });
  const flags = { ...(existing?.flags as any || {}), timezone };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { firstName, lastName, email, flags },
  });
  const data = await fetchSettings(session.user.id);
  return NextResponse.json(data);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await prisma.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ ok: true });
}

export { fetchSettings as getProfessionalSettings };

