import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { differenceInMinutes } from 'date-fns';
import { auth } from '../../../../../../auth';

export async function POST(req: NextRequest, { params }:{params:{id:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if(!booking) return NextResponse.json({error:'not_found'}, {status:404});

  const actor = session.user.id === booking.candidateId ? 'candidate' : (session.user.id === booking.professionalId ? 'professional' : 'none');
  if(actor === 'none') return NextResponse.json({error:'forbidden'}, {status:403});

  let refundRule = 'none';
  if(actor === 'professional'){
    refundRule = 'full_refund';
  } else {
    const mins = Math.abs((booking.startAt.getTime() - Date.now())/60000);
    refundRule = mins >= 180 ? 'full_refund' : 'half_refund';
  }

  await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
  return NextResponse.json({ refundRule });
}
