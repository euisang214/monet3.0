import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { rateLimit } from '../../../../../lib/rate-limit';
import { auth } from '@/auth';

export async function POST(req: NextRequest){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  if(!rateLimit(`req:${session.user.id}`)) return NextResponse.json({error:'rate_limited'}, {status:429});
  const body = await req.json();
  const { professionalId, priceUSD } = body;
  const booking = await prisma.booking.create({
    data: {
      candidateId: session.user.id,
      professionalId,
      status: 'requested',
      startAt: new Date(0),
      endAt: new Date(0),
    }
  });
  return NextResponse.json({ id: booking.id, status: booking.status, priceUSD });
}
