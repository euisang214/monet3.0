import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { createCheckoutIntent, ensureCustomer } from '@/lib/integrations/stripe';
import { createZoomMeeting } from '@/lib/integrations/zoom';
import { auth } from '@/auth';

export async function POST(req: NextRequest, { params }:{params:{id:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});

  // Fetch booking with candidate user data in a single query for better performance
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      candidate: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          stripeCustomerId: true,
        },
      },
    },
  });

  if(!booking || booking.candidateId !== session.user.id) return NextResponse.json({error:'forbidden'}, {status:403});

  // Pass existing customer ID to avoid redundant database query
  const customerId = await ensureCustomer(
    booking.candidate.id,
    booking.candidate.email,
    `${booking.candidate.firstName || ''} ${booking.candidate.lastName || ''}`.trim(),
    booking.candidate.stripeCustomerId,
  );
  if (booking.priceUSD == null)
    return NextResponse.json({ error: 'price_missing' }, { status: 500 });
  const priceUSD = booking.priceUSD;
  // Pass priceUSD to avoid redundant database query
  const pi = await createCheckoutIntent(booking.id, { customerId, priceUSD });
  const meeting = await createZoomMeeting('Monet Call', booking.startAt.toISOString());

  const updated = await prisma.booking.update({ where: { id: booking.id }, data: {
    priceUSD,
    zoomMeetingId: meeting.id,
    zoomJoinUrl: meeting.join_url,
  }});

  return NextResponse.json({
    clientSecret: (pi as any).client_secret,
    paymentIntentId: pi.id,
    booking: updated,
  });
}
