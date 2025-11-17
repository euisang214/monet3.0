import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { auth } from '@/auth';

/**
 * Professional declines a booking request
 * Note: Declined bookings are marked as 'cancelled' since there's no separate 'declined' status
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking || booking.professionalId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Only allow declining requests that are in 'requested' status
  if (booking.status !== 'requested') {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
  return NextResponse.json({ status: 'cancelled' });
}
