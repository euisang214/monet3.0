import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { getBusyTimes } from '../../../../../lib/calendar/google';

export async function GET(){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'},{status:401});
  const busy = await getBusyTimes(session.user.id);
  return NextResponse.json({ busy });
}