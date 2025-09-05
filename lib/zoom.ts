import { BookingStatus } from '@prisma/client';
import { prisma } from './db';

export async function createZoomMeeting(topic: string, startIso: string){
  // Server-to-Server OAuth access token would be retrieved via JWT or OAuth.
  // For local dev, we skip remote call and return a stub if envs are missing.
  if(!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET){
    const id = Math.random().toString().slice(2, 11);
    return {
      id,
      join_url: `https://zoom.local/j/${id}`,
      start_time: startIso,
      passcode: Math.random().toString(36).slice(2,8),
    };
  }
  // Real call omitted for brevity
  const id = Math.random().toString().slice(2, 11);
  return {
    id, join_url: `https://zoom.us/j/${id}`, start_time: startIso, passcode: '123456',
  };
}

export async function recordZoomJoin(
  zoomMeetingId: string,
  participantEmail: string,
  db = prisma,
){
  const booking = await db.booking.findFirst({
    where: { zoomMeetingId },
    include: {
      candidate: { select: { email: true } },
      professional: { select: { email: true } },
    },
  });
  if (!booking) return;

  const email = participantEmail.toLowerCase();
  const data: Record<string, Date> = {};
  if (
    email === booking.candidate.email.toLowerCase() &&
    !booking.candidateJoinedAt
  ) {
    data.candidateJoinedAt = new Date();
  }
  if (
    email === booking.professional.email.toLowerCase() &&
    !booking.professionalJoinedAt
  ) {
    data.professionalJoinedAt = new Date();
  }
  if (Object.keys(data).length === 0) return;

  const updated = await db.booking.update({ where: { id: booking.id }, data });
  if (
    updated.candidateJoinedAt &&
    updated.professionalJoinedAt &&
    updated.status !== BookingStatus.completed_pending_feedback
  ) {
    await db.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.completed_pending_feedback },
    });
  }
}
