import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { rateLimit } from '../../../../../lib/rate-limit';
import { auth } from '@/auth';
import { mailer } from '../../../../../lib/email';

export async function POST(req: NextRequest){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  if(!rateLimit(`req:${session.user.id}`)) return NextResponse.json({error:'rate_limited'}, {status:429});
  const body = await req.json();
  const { professionalId } = body;
  const pro = await prisma.professionalProfile.findUnique({ where: { userId: professionalId }, select: { priceUSD: true } });
  const booking = await prisma.booking.create({
    data: {
      candidateId: session.user.id,
      professionalId,
      status: 'requested',
      startAt: new Date(0),
      endAt: new Date(0),
      priceUSD: pro?.priceUSD ?? 0,
    }
  });
  if(process.env.SMTP_HOST){
    const pro = await prisma.user.findUnique({ where: { id: professionalId }, select: { email: true } });
    if(pro?.email){
      await mailer.sendMail({
        to: pro.email,
        subject: 'New booking request',
        text: `You have a new booking request from ${session.user.email}.`,
      });
    }
  }
  return NextResponse.json({ id: booking.id, status: booking.status, priceUSD: booking.priceUSD });
}
