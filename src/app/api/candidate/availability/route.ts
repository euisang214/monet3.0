import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '../../../../../lib/db';

export async function POST(req: Request){
  const session = await auth();
  if(!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { events = [], busy = [] } = await req.json();

  await prisma.availability.deleteMany({ where: { userId: session.user.id } });
  const data = [
    ...events.map((e: any) => ({ userId: session.user.id, start: e.start, end: e.end, busy: false })),
    ...busy.map((e: any) => ({ userId: session.user.id, start: e.start, end: e.end, busy: true })),
  ];
  if(data.length) await prisma.availability.createMany({ data });
  return NextResponse.json({ ok: true });
}
