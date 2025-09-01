import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '../../../../../lib/db';
import {
  stripe,
  ensureConnectedAccount,
  createAccountOnboardingLink,
} from '../../../../../lib/payments/stripe';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeAccountId) {
    return NextResponse.json({ status: 'not_connected' });
  }

  try {
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const status = account.charges_enabled && account.payouts_enabled
      ? 'complete'
      : account.details_submitted
      ? 'pending'
      : 'incomplete';
    return NextResponse.json({
      status,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (e) {
    return NextResponse.json({ error: 'stripe_error' }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  }

  try {
    const accountId = await ensureConnectedAccount(
      session.user.id,
      session.user.email || '',
      user.firstName || '',
      user.lastName || '',
    );
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const onboardingUrl = await createAccountOnboardingLink(
      accountId,
      `${baseUrl}/professional/settings`,
      `${baseUrl}/professional/settings`,
    );
    return NextResponse.json({ onboardingUrl });
  } catch (e) {
    return NextResponse.json({ error: 'stripe_error' }, { status: 500 });
  }
}

