import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { CALL_DURATION_MINUTES } from '../../../../../../lib/flags';
import { auth } from '@/auth';
import { createZoomMeeting, generateZoomCalendarInvite } from '../../../../../../lib/zoom';
import { sendEmail } from '../../../../../../lib/email';

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
  const users = await prisma.user.findMany({
    where: { id: { in: [booking.professionalId, booking.candidateId] } },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  const professional = users.find((u) => u.id === booking.professionalId);
  const candidate = users.find((u) => u.id === booking.candidateId);

  const proEmail = professional?.email;
  const candEmail = candidate?.email;
  const proName = professional ? `${professional.firstName || ''} ${professional.lastName || ''}`.trim() : undefined;
  const candName = candidate ? `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() : undefined;

  // Generate enhanced calendar invite with Zoom details
  const ics = generateZoomCalendarInvite(
    zoom,
    start,
    end,
    updated.id,
    candName,
    proName
  );

  const recipients = [proEmail, candEmail].filter(Boolean).join(',');
  if (recipients) {
    const emailBody = `Your mentorship call has been scheduled!

Join Zoom Meeting: ${zoom.join_url}

Meeting ID: ${zoom.id}
Passcode: ${zoom.passcode}

Time: ${start.toLocaleString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short'
})}

Duration: ${CALL_DURATION_MINUTES} minutes

A calendar invite with dial-in details has been attached to this email.`;

    await sendEmail({
      to: recipients,
      subject: 'Monet Mentorship Call - Confirmed',
      text: emailBody,
      icalEvent: { method: 'REQUEST', filename: 'invite.ics', content: ics },
    });
  }

  return NextResponse.json({ id: updated.id, startAt: updated.startAt, endAt: updated.endAt, status: updated.status });
}
