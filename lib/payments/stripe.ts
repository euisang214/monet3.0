import Stripe from 'stripe';
import { prisma } from '../db';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' } as any);

export const PLATFORM_FEE = 0.20;

export async function createCheckoutIntent(bookingId: string, amountUSD: number){
  const amount = Math.round(amountUSD * 100);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if(!booking) throw new Error('booking not found');

  // In real flow we would accept card details via Stripe Elements on client.
  // Here we just pre-create a PaymentIntent for demo purposes.
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { bookingId },
  });

  await prisma.payment.create({
    data: {
      bookingId,
      amountGross: amount,
      platformFee: Math.round(amount * PLATFORM_FEE),
      escrowHoldId: pi.id,
      status: 'held',
    }
  });

  return pi;
}
