import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { prisma } from '../../../../lib/db';
import {
  ensureCustomer,
  ensureConnectedAccount,
  createAccountOnboardingLink,
} from '../../../../lib/payments/stripe';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const base = z.object({
    role: z.enum(['CANDIDATE', 'PROFESSIONAL']),
    firstName: z.string(),
    lastName: z.string(),
  });
  const parsedBase = base.safeParse(body);
  if (!parsedBase.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const { role, firstName, lastName } = parsedBase.data;
  if (role === 'CANDIDATE') {
    const schema = base.extend({
      resumeUrl: z.string().url().optional(),
      interests: z.string().optional(),
      activities: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const { resumeUrl, interests, activities } = parsed.data;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role, firstName, lastName },
    });
    await prisma.candidateProfile.upsert({
      where: { userId: session.user.id },
      update: {
        resumeUrl: resumeUrl || undefined,
        interests: interests ? interests.split(',').map((s) => s.trim()) : [],
        activities: activities ? activities.split(',').map((s) => s.trim()) : [],
      },
      create: {
        userId: session.user.id,
        resumeUrl: resumeUrl || undefined,
        interests: interests ? interests.split(',').map((s) => s.trim()) : [],
        activities: activities ? activities.split(',').map((s) => s.trim()) : [],
      },
    });
    await ensureCustomer(
      session.user.id,
      session.user.email || '',
      `${firstName} ${lastName}`,
    );
  } else {
    const schema = base.extend({
      employer: z.string(),
      title: z.string(),
      seniority: z.string(),
      bio: z.string(),
      priceUSD: z.number(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const { employer, title, seniority, bio, priceUSD } = parsed.data;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role, firstName, lastName },
    });
    await prisma.professionalProfile.upsert({
      where: { userId: session.user.id },
      update: {
        employer,
        title,
        seniority,
        bio,
        priceUSD,
      },
      create: {
        userId: session.user.id,
        employer,
        title,
        seniority,
        bio,
        priceUSD,
      },
    });
    const accountId = await ensureConnectedAccount(
      session.user.id,
      session.user.email || '',
      firstName,
      lastName,
    );
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const onboardingUrl = await createAccountOnboardingLink(
      accountId,
      baseUrl,
      `${baseUrl}/professional/dashboard`,
    );
    return NextResponse.json({ ok: true, onboardingUrl });
  }
  return NextResponse.json({ ok: true });
}
