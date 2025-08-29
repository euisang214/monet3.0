import { google } from 'googleapis';
import { prisma } from '../db';
import { CALL_DURATION_MINUTES } from '../flags';

export async function isCalendarConnected(userId: string){
  const acc = await prisma.oAuthAccount.findFirst({ where: { userId, provider: 'google' } });
  return !!acc;
}

export async function getBusyTimes(userId: string){
  const acc = await prisma.oAuthAccount.findFirst({ where: { userId, provider: 'google' } });
  if(!acc?.accessToken) return [];
  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2.setCredentials({ access_token: acc.accessToken, refresh_token: acc.refreshToken || undefined });
  const cal = google.calendar({ version: 'v3', auth: oauth2 });
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  try{
    const res = await cal.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: nextMonth.toISOString(),
        items: [{ id: 'primary' }]
      }
    });
    const busy = res.data.calendars?.primary?.busy || [];
    return busy.map(b => ({ start: b.start as string, end: b.end as string }));
  }catch(err){
    console.error('Failed to fetch busy times', err);
    return [];
  }
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