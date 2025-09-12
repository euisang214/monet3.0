import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { auth } from '@/auth';
import { sendEmail } from '../../../../../lib/email';

export async function POST(req: NextRequest){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const { corporateEmail } = await req.json();
  const token = Math.random().toString(36).slice(2,10);
  await prisma.verification.create({
    data: { userId: session.user.id, corporateEmail, token },
  });
  try {
    await sendEmail({
      to: corporateEmail,
      subject: 'Verify your corporate email',
      text: `Click: ${process.env.APP_URL}/api/verification/confirm?token=${token}`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
