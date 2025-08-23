import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest){
  // This route exists to satisfy Stripe webhook configuration during dev.
  const raw = await req.text();
  return NextResponse.json({ received: true });
}
