import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { getBusyTimes } from '../../../../../lib/calendar/google';

export async function GET(){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    const busy = await getBusyTimes(session.user.id);
    return NextResponse.json({ busy });
  }catch(err: any){
    if(err.message === 'NOT_AUTHENTICATED'){
      return NextResponse.json({ error: 'google_auth_required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'failed_to_fetch' }, { status: 500 });
  }
}