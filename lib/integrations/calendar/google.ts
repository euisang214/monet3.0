import { google } from 'googleapis';
import { prisma } from '@/lib/core/db';
import type { TimeSlot } from '@/lib/shared/availability';
import { createTimeSlotFromDates, ensureTimezone, mergeSlots } from '@/lib/shared/availability';

export const GOOGLE_FREE_BUSY_TIMEZONE = 'America/New_York';

export async function isCalendarConnected(userId: string){
  const acc = await prisma.oAuthAccount.findFirst({ where: { userId, provider: 'google' } });
  return !!acc;
}

export async function getBusyTimes(userId: string): Promise<TimeSlot[]>{
  const acc = await prisma.oAuthAccount.findFirst({ where: { userId, provider: 'google' } });
  if(!acc?.accessToken) throw new Error('NOT_AUTHENTICATED');
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
    ensureTimezone(GOOGLE_FREE_BUSY_TIMEZONE);
    const busy = (res.data.calendars?.primary?.busy || [])
      .map(b => ({
        start: new Date(b.start as string),
        end: new Date(b.end as string),
      }))
      .filter(b => !Number.isNaN(b.start.getTime()) && !Number.isNaN(b.end.getTime()))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    return mergeSlots(
      busy
        .filter(range => range.end > range.start)
        .map(({ start, end }) => createTimeSlotFromDates(start, end, GOOGLE_FREE_BUSY_TIMEZONE)),
    );
  }catch(err: any){
    console.error('Failed to fetch free times', err);
    if(err?.code === 401 || err?.response?.status === 401){
      throw new Error('NOT_AUTHENTICATED');
    }
    return [];
  }
}

