import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { createCheckoutIntent, ensureCustomer } from '../../../../../../lib/payments/stripe';
import { auth } from '@/auth';

export async function POST(req: NextRequest, { params }:{params:{id:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if(!booking || booking.candidateId !== session.user.id) return NextResponse.json({error:'forbidden'}, {status:403});
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if(!user) return NextResponse.json({error:'user_not_found'}, {status:404});
  const customerId = await ensureCustomer(
    user.id,
    user.email,
    `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  );
  if (booking.priceUSD == null)
    return NextResponse.json({ error: 'price_missing' }, { status: 500 });
  const priceUSD = booking.priceUSD;
  const pi = await createCheckoutIntent(booking.id, { customerId });

  const updated = await prisma.booking.update({ where: { id: booking.id }, data: {
    priceUSD,
  }});

  return NextResponse.json({
    clientSecret: (pi as any).client_secret,
    paymentIntentId: pi.id,
    booking: updated,
  });
}
