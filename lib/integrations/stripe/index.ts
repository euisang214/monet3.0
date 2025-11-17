import Stripe from 'stripe';
import { prisma } from '@/lib/core/db';

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) throw new Error('STRIPE_SECRET_KEY env var is required');

export const stripe = new Stripe(secret, {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
});

// PLATFORM_FEE is expected to be a decimal percentage (e.g. 0.1 for 10%)
export const PLATFORM_FEE = Number(process.env.PLATFORM_FEE || '0');

/**
 * Create a PaymentIntent for a booking. Funds are held by the platform until
 * released to the professional. Optionally apply a platform fee percentage.
 */
export async function createCheckoutIntent(
  bookingId: string,
  opts: { takeRate?: number; customerId?: string; priceUSD?: number } = {},
) {
  const { takeRate = PLATFORM_FEE, customerId, priceUSD: providedPrice } = opts;

  // Optimize by allowing price to be passed in to avoid redundant DB query
  let priceUSD = providedPrice;
  if (priceUSD == null) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { priceUSD: true } });
    if (!booking) throw new Error('booking not found');
    priceUSD = booking.priceUSD ?? undefined;
  }

  if (priceUSD == null) throw new Error('booking price not set');
  const amount = Math.round(priceUSD * 100);

  const pi = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { bookingId },
    customer: customerId,
  });

  const platformFee = Math.round(amount * takeRate);

  await prisma.payment.create({
    data: {
      bookingId,
      amountGross: amount,
      platformFee,
      escrowHoldId: pi.id,
      status: 'held',
    },
  });

  return pi;
}

/** Ensure a Stripe Customer exists for a user and return the ID */
export async function ensureCustomer(
  userId: string,
  email: string,
  name: string,
  existingCustomerId?: string | null,
) {
  // Optimize by allowing existing customer ID to be passed in
  if (existingCustomerId) return existingCustomerId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({ email, name });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/** Ensure a connected account exists for payouts */
export async function ensureConnectedAccount(
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  existingAccountId?: string | null,
) {
  // Optimize by allowing existing account ID to be passed in
  if (existingAccountId) return existingAccountId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  });
  if (user?.stripeAccountId) return user.stripeAccountId;

  const account = await stripe.accounts.create({
    type: 'express',
    email,
    business_type: 'individual',
    individual: { first_name: firstName, last_name: lastName },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });
  return account.id;
}

/** Create an Express onboarding link for a connected account */
export async function createAccountOnboardingLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return link.url;
}

/** Create an Express account update link for a connected account */
export async function createAccountUpdateLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_update',
  });
  return link.url;
}

/**
 * Release held funds to a professional's connected Stripe account.
 * The platform retains the fee recorded at checkout.
 */
export async function releaseEscrowToProfessional(
  bookingId: string,
  proStripeAccountId: string,
) {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment) throw new Error('payment not found');
  if (payment.status !== 'held') throw new Error('payment not in held state');

  const pi = await stripe.paymentIntents.retrieve(payment.escrowHoldId, {
    expand: ['charges'],
  });
  const chargeId = (pi as any).charges?.data?.[0]?.id;
  if (!chargeId) throw new Error('charge not found');

  const amountNet = payment.amountGross - payment.platformFee;

  const transfer = await stripe.transfers.create({
    amount: amountNet,
    currency: 'usd',
    destination: proStripeAccountId,
    source_transaction: chargeId,
  });

  await prisma.payment.update({
    where: { bookingId },
    data: { status: 'released' },
  });

  await prisma.payout.create({
    data: {
      bookingId,
      proStripeAccountId,
      amountNet,
      status: 'paid',
    },
  });

  return transfer;
}

/**
 * Refund a candidate for a booking.
 */
export async function refundPayment(bookingId: string) {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment) throw new Error('payment not found');

  const pi = await stripe.paymentIntents.retrieve(payment.escrowHoldId, {
    expand: ['charges'],
  });
  const chargeId = (pi as any).charges?.data?.[0]?.id;
  if (!chargeId) throw new Error('charge not found');

  await stripe.refunds.create({ charge: chargeId });

  await prisma.payment.update({
    where: { bookingId },
    data: { status: 'refunded' },
  });

  await prisma.payout.updateMany({
    where: { bookingId },
    data: { status: 'blocked', reason: 'refund' },
  });
}
