import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { stripe, ensureCustomer } from '../../../../../lib/payments/stripe';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { professionalId } = await req.json();
  if (!professionalId)
    return NextResponse.json({ error: 'missing_professional' }, { status: 400 });

  const pro = await prisma.professionalProfile.findUnique({
    where: { userId: professionalId },
    select: { priceUSD: true },
  });
  if (!pro?.priceUSD)
    return NextResponse.json({ error: 'price_missing' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  const customerId = await ensureCustomer(
    user.id,
    user.email,
    `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  );

  const pi = await stripe.paymentIntents.create({
    amount: Math.round(pro.priceUSD * 100),
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    customer: customerId,
    metadata: { professionalId },
  });

  return NextResponse.json({
    clientSecret: (pi as any).client_secret,
    paymentIntentId: pi.id,
  });
}

