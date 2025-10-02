import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFreeTimes } from '../../../../../lib/calendar/google';

export async function GET(){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    const free = await getFreeTimes(session.user.id);
    return NextResponse.json({ free });
  }catch(err: any){
    if(err.message === 'NOT_AUTHENTICATED'){
      return NextResponse.json({ error: 'google_auth_required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'failed_to_fetch' }, { status: 500 });
  }
}