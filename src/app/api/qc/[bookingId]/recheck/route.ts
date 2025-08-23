import { NextResponse } from 'next/server';
import { enqueueFeedbackQC } from '../../../../../../lib/queues';

export async function POST(_: Request, { params }:{params:{bookingId:string}}){
  await enqueueFeedbackQC(params.bookingId);
  return NextResponse.json({ ok: true });
}
