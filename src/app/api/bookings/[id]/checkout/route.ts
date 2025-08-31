import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { createCheckoutIntent, ensureCustomer } from '../../../../../../lib/payments/stripe';
import { createZoomMeeting } from '../../../../../../lib/zoom';
import { auth } from '@/auth';

export async function POST(req: NextRequest, { params }:{params:{id:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if(!booking || booking.candidateId !== session.user.id) return NextResponse.json({error:'forbidden'}, {status:403});
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if(!user) return NextResponse.json({error:'user_not_found'}, {status:404});
  const { priceUSD = 40 } = await req.json();
  const customerId = await ensureCustomer(
    user.id,
    user.email,
    `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  );

  const pi = await createCheckoutIntent(booking.id, priceUSD, { customerId });
  const meeting = await createZoomMeeting('Monet Call', booking.startAt.toISOString());

  const updated = await prisma.booking.update({ where: { id: booking.id }, data: {
    status: 'accepted',
    zoomMeetingId: String(meeting.id),
    zoomJoinUrl: meeting.join_url,
  }});

  return NextResponse.json({
    clientSecret: (pi as any).client_secret,
    paymentIntentId: pi.id,
    booking: updated,
    zoom: meeting,
  });
}
