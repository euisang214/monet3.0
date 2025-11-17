import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/core/db';

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  start_time: string;
  password: string;
  encrypted_password: string;
  settings: {
    global_dial_in_numbers?: Array<{
      number: string;
      type: string;
      country: string;
      country_name: string;
    }>;
  };
}

interface ZoomMeetingDetails {
  id: string;
  join_url: string;
  start_time: string;
  passcode: string;
  encrypted_password: string;
  dial_in_numbers?: Array<{
    number: string;
    type: string;
    country: string;
    country_name: string;
  }>;
}

async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get Zoom access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createZoomMeeting(topic: string, startIso: string): Promise<ZoomMeetingDetails> {
  // For local dev, return a stub if envs are missing
  if(!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET){
    const id = Math.random().toString().slice(2, 11);
    return {
      id,
      join_url: `https://zoom.local/j/${id}`,
      start_time: startIso,
      passcode: Math.random().toString(36).slice(2,8),
      encrypted_password: 'local',
    };
  }

  // Get Server-to-Server OAuth access token
  const accessToken = await getZoomAccessToken();

  // Create meeting with full settings
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      type: 2, // Scheduled meeting
      start_time: startIso,
      duration: 30, // 30 minutes
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        watermark: false,
        audio: 'both', // Both telephony and VoIP
        auto_recording: 'none',
        waiting_room: false,
        global_dial_in_numbers: true, // Include dial-in numbers
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Zoom meeting: ${response.statusText} - ${errorText}`);
  }

  const meeting: ZoomMeetingResponse = await response.json();

  return {
    id: String(meeting.id),
    join_url: meeting.join_url,
    start_time: meeting.start_time,
    passcode: meeting.password,
    encrypted_password: meeting.encrypted_password,
    dial_in_numbers: meeting.settings.global_dial_in_numbers,
  };
}

export function generateZoomCalendarInvite(
  meetingDetails: ZoomMeetingDetails,
  startDate: Date,
  endDate: Date,
  bookingId: string,
  candidateName?: string,
  professionalName?: string
): string {
  const formatICS = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Format dial-in numbers
  let dialInText = '';
  if (meetingDetails.dial_in_numbers && meetingDetails.dial_in_numbers.length > 0) {
    dialInText = '\n\nOne tap mobile:\n';
    const uniqueNumbers = new Map();

    // Get unique numbers (Zoom sometimes returns duplicates)
    meetingDetails.dial_in_numbers.forEach(num => {
      if (!uniqueNumbers.has(num.country)) {
        uniqueNumbers.set(num.country, num);
      }
    });

    // Add quick dial numbers (first 2)
    Array.from(uniqueNumbers.values()).slice(0, 2).forEach(num => {
      dialInText += `${num.number},,${meetingDetails.id}#,,,,*${meetingDetails.passcode}# ${num.country_name}\n`;
    });

    dialInText += '\n\nDial by your location:\n';
    uniqueNumbers.forEach(num => {
      dialInText += `        ${num.number} ${num.country_name}\n`;
    });

    dialInText += `\nMeeting ID: ${meetingDetails.id}\nPasscode: ${meetingDetails.passcode}`;
  }

  const description = `${candidateName && professionalName ? `${candidateName} is inviting you to a scheduled Zoom meeting with ${professionalName}.\n\n` : ''}Join Zoom Meeting
${meetingDetails.join_url}

Meeting ID: ${meetingDetails.id}
Passcode: ${meetingDetails.passcode}${dialInText}`;

  // Escape special characters for ICS format
  const escapeICS = (str: string) =>
    str.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Monet//Mentorship Call//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${bookingId}@monet.app
DTSTAMP:${formatICS(new Date())}
DTSTART:${formatICS(startDate)}
DTEND:${formatICS(endDate)}
SUMMARY:Monet Mentorship Call
DESCRIPTION:${escapeICS(description)}
LOCATION:${meetingDetails.join_url}
URL:${meetingDetails.join_url}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder: Meeting starts in 15 minutes
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return ics;
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
