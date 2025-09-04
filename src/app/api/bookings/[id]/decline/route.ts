import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { auth } from '@/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking || booking.professionalId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
  return NextResponse.json({ status: 'cancelled' });
}
