import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/core/db";
import { stripe, ensureCustomer } from "@/lib/integrations/stripe";
import { withAuth } from '@/lib/core/api-helpers';
import { formatFullName } from '@/lib/shared/settings';

export const POST = withAuth(async (session, req: NextRequest) => {

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
    formatFullName(user.firstName, user.lastName),
  );

  // priceUSD is already in cents (e.g., 10000 = $100.00), pass directly to Stripe
  const pi = await stripe.paymentIntents.create({
    amount: pro.priceUSD,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    customer: customerId,
    metadata: { professionalId },
  });

  return NextResponse.json({
    clientSecret: (pi as any).client_secret,
    paymentIntentId: pi.id,
  });
});

