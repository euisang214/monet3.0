import { google } from 'googleapis';
import { prisma } from '../db';
import { CALL_DURATION_MINUTES } from '../flags';

export async function isCalendarConnected(userId: string){
  const acc = await prisma.oAuthAccount.findFirst({ where: { userId, provider: 'google' } });
  return !!acc;
}

export async function mergedAvailability(proId: string, candId: string){
  // Placeholder: in real implementation we'd merge free/busy results.
  // Return a few 30-min slots in the next days.
  const now = new Date();
  const slots = [];
  for(let d=1; d<=5; d++){
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()+d, 14, 0, 0);
    const end = new Date(start.getTime() + CALL_DURATION_MINUTES*60*1000);
    slots.push({ startAt: start.toISOString(), endAt: end.toISOString() });
  }
  return slots;
}
