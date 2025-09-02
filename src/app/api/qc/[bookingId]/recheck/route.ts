import { NextResponse } from 'next/server';

export async function POST(_: Request, { params }:{params:{bookingId:string}}){
  const { enqueueFeedbackQC } = await import('../../../../../../lib/queues');
  await enqueueFeedbackQC(params.bookingId);
  return NextResponse.json({ ok: true });
}
