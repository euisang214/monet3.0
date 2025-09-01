import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '../../../../../lib/db';
import { mergeSlots, splitIntoSlots } from '../../../../../lib/availability';

export async function POST(req: Request){
  const session = await auth();
  if(!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { events = [], busy = [] } = await req.json();

  const mergedEvents = mergeSlots(events);
  const mergedBusy = mergeSlots(busy);

  await prisma.availability.deleteMany({ where: { userId: session.user.id } });
  const data = [
    ...mergedEvents.map((e: any) => ({ userId: session.user.id, start: e.start, end: e.end, busy: false })),
    ...mergedBusy.map((e: any) => ({ userId: session.user.id, start: e.start, end: e.end, busy: true })),
  ];
  if(data.length) await prisma.availability.createMany({ data });
  return NextResponse.json({ ok: true });
}

export async function GET(){
  const session = await auth();
  if(!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rows = await prisma.availability.findMany({
    where: { userId: session.user.id },
    orderBy: { start: 'asc' },
  });
  const events = splitIntoSlots(
    rows.filter(r => !r.busy).map(r => ({ start: r.start.toISOString(), end: r.end.toISOString() }))
  );
  const busy = splitIntoSlots(
    rows.filter(r => r.busy).map(r => ({ start: r.start.toISOString(), end: r.end.toISOString() }))
  );
  return NextResponse.json({ events, busy });
}
