import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { CALL_DURATION_MINUTES } from '../../../../../../lib/flags';
import { auth } from '@/auth';
import { createZoomMeeting } from '../../../../../../lib/zoom';
import { mailer } from '../../../../../../lib/email';

export async function POST(req: NextRequest, { params }:{params:{id:string}}){
  const session = await auth();
  if(!session?.user) return NextResponse.json({error:'unauthorized'}, {status:401});
  const { startAt } = await req.json();
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if(!booking || booking.professionalId !== session.user.id) return NextResponse.json({error:'forbidden'}, {status:403});
  const start = new Date(startAt);
  const end = new Date(start.getTime() + CALL_DURATION_MINUTES*60*1000);
  const zoom = await createZoomMeeting('Mentorship Call', start.toISOString());
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      startAt: start,
      endAt: end,
      status: 'accepted',
      zoomMeetingId: zoom.id,
      zoomJoinUrl: zoom.join_url,
    },
  });

  if (process.env.SMTP_HOST) {
    const users = await prisma.user.findMany({
      where: { id: { in: [booking.professionalId, booking.candidateId] } },
      select: { id: true, email: true },
    });
    const proEmail = users.find((u) => u.id === booking.professionalId)?.email;
    const candEmail = users.find((u) => u.id === booking.candidateId)?.email;
    const formatICS = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${updated.id}\nDTSTAMP:${formatICS(
      new Date()
    )}\nDTSTART:${formatICS(start)}\nDTEND:${formatICS(end)}\nSUMMARY:Mentorship Call\nDESCRIPTION:Join Zoom meeting at ${zoom.join_url}\nURL:${zoom.join_url}\nEND:VEVENT\nEND:VCALENDAR`;
    const recipients = [proEmail, candEmail].filter(Boolean).join(',');
    if (recipients) {
      await mailer.sendMail({
        to: recipients,
        subject: 'Call Confirmed',
        text: `Join Zoom meeting: ${zoom.join_url}`,
        icalEvent: { method: 'REQUEST', filename: 'invite.ics', content: ics },
      });
    }
  }

  return NextResponse.json({ id: updated.id, startAt: updated.startAt, endAt: updated.endAt, status: updated.status });
}
