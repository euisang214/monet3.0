import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';

export async function GET(req: NextRequest){
  const token = req.nextUrl.searchParams.get('token') || '';
  const vr = await prisma.verification.findFirst({ where: { token } });
  if(!vr) return NextResponse.json({error:'invalid'}, {status:400});
  await prisma.user.update({ where: { id: vr.userId }, data: { corporateEmailVerified: true } });
  await prisma.verification.update({ where: { id: vr.id }, data: { verifiedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
