import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '../../../../../lib/db';
import { s3 } from '../../../../../lib/s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return { name: fullName, email: user.email, resumeUrl, notifications, defaultBusy };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const data = await fetchSettings(session.user.id);
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const form = await req.formData();
  const name = (form.get('name') as string) || '';
  const email = (form.get('email') as string) || '';
  const notifications = JSON.parse((form.get('notifications') as string) || '{}');
  const defaultBusy = JSON.parse((form.get('defaultBusy') as string) || '[]');
  const file = form.get('resume') as File | null;

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { flags: true },
  });
  const flags = { ...(existing?.flags as any || {}), notifications, defaultBusy };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { firstName, lastName, email, flags },
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
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await prisma.user.delete({ where: { id: session.user.id } });
  // CandidateProfile has an onDelete: Cascade relation with User, so deleting the
  // user will automatically remove the candidate profile. Attempting to delete
  // it explicitly after the user has been removed results in a "Record to
  // delete does not exist" error, which caused the delete account button to fail.
  return NextResponse.json({ ok: true });
}

export { fetchSettings as getCandidateSettings };
