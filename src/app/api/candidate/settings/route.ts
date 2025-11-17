import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/core/api-helpers';
import { prisma } from "@/lib/core/db";
import { s3 } from '@/lib/integrations/s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { parseFullName, formatFullName, deleteUserAccount } from '@/lib/shared/settings';

async function fetchSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { candidateProfile: true },
  });
  if (!user) return null;
  let resumeUrl = user.candidateProfile?.resumeUrl ?? null;
  if (resumeUrl && process.env.AWS_S3_BUCKET) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: resumeUrl,
      });
      resumeUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    } catch {
      // ignore S3 errors
    }
  }
  const flags: any = user.flags || {};
  const notifications = flags.notifications || {
    feedbackReceived: true,
    chatScheduled: true,
  };
  const defaultBusy = flags.defaultBusy || [];
  const fullName = formatFullName(user.firstName, user.lastName);
  const timezone = user.timezone;
  return {
    name: fullName,
    email: user.email,
    resumeUrl,
    notifications,
    defaultBusy,
    timezone,
  };
}

export const GET = withAuth(async (session) => {
  const data = await fetchSettings(session.user.id);
  return NextResponse.json(data);
});

export const PUT = withAuth(async (session, req: Request) => {
  const form = await req.formData();
  const name = (form.get('name') as string) || '';
  const email = (form.get('email') as string) || '';
  const notifications = JSON.parse((form.get('notifications') as string) || '{}');
  const defaultBusyRaw = (form.get('defaultBusy') as string) || '[]';
  const defaultBusy = JSON.parse(defaultBusyRaw);
  const timezone = (form.get('timezone') as string) || '';
  const file = form.get('resume') as File | null;

  const { firstName, lastName } = parseFullName(name);

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { flags: true },
  });
  const flags = {
    ...(existing?.flags as any || {}),
    notifications,
    defaultBusy,
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { firstName, lastName, email, flags, timezone },
  });

  if (file && file.size > 0 && process.env.AWS_S3_BUCKET) {
    const arrayBuffer = await file.arrayBuffer();
    const key = `resumes/${session.user.id}-${Date.now()}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      })
    );
    await prisma.candidateProfile.upsert({
      where: { userId: session.user.id },
      update: { resumeUrl: key },
      create: { userId: session.user.id, resumeUrl: key },
    });
  }

  const data = await fetchSettings(session.user.id);
  return NextResponse.json(data);
});

export const DELETE = withAuth(async (session) => {
  await deleteUserAccount(session.user.id);
  return NextResponse.json({ ok: true });
});

export { fetchSettings as getCandidateSettings };
