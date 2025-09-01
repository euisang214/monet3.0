import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { CALL_DURATION_MINUTES } from '../../../../../../lib/flags';
import { auth } from '@/auth';

export async function POST(req: NextRequest, { params }:{params:{id:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const { startAt } = await req.json();
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if(!booking || booking.professionalId !== session.user.id) return NextResponse.json({error:'forbidden'}, {status:403});
  const start = new Date(startAt);
  const end = new Date(start.getTime() + CALL_DURATION_MINUTES*60*1000);
  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { startAt: start, endAt: end, status: 'accepted' } });
  return NextResponse.json({ id: updated.id, startAt: updated.startAt, endAt: updated.endAt, status: updated.status });
}
