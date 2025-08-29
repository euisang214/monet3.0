import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '../../../../../lib/payments/stripe';
import { prisma } from '../../../../../lib/db';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || '';
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { escrowHoldId: pi.id },
        data: { status: 'held' },
      });
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const pid =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;
      if (pid) {
        await prisma.payment.updateMany({
          where: { escrowHoldId: pid },
          data: { status: 'refunded' },
        });
      }
      break;
    }
    default:
      // Ignore other events
      break;
  }

  return NextResponse.json({ received: true });
}
