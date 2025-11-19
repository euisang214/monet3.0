import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/core/api-helpers';
import { prisma } from "@/lib/core/db";
import {
  ensureCustomer,
  ensureConnectedAccount,
  createAccountOnboardingLink,
} from "@/lib/integrations/stripe";
import { z } from 'zod';
import { timezones } from '@/lib/utils/timezones';
import { formatFullName } from '@/lib/shared/settings';

export const POST = withAuth(async (session, req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const base = z.object({
    role: z.enum(['CANDIDATE', 'PROFESSIONAL']),
    firstName: z.string(),
    lastName: z.string(),
    timezone: z.string().refine((tz) => timezones.includes(tz)),
  });
  const parsedBase = base.safeParse(body);
  if (!parsedBase.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const { role, firstName, lastName, timezone } = parsedBase.data;
  if (role === 'CANDIDATE') {
    const schema = base.extend({
      resumeUrl: z.string().url().optional(),
      interests: z.array(z.string().min(1)).min(1),
      activities: z.array(z.string().min(1)).min(1),
      experience: z
        .array(
          z.object({
            firm: z.string().min(1),
            title: z.string().min(1),
            startDate: z.string().min(1),
            endDate: z.string().min(1),
          }),
        )
        .min(1),
      education: z
        .array(
          z.object({
            school: z.string().min(1),
            title: z.string().min(1),
            startDate: z.string().min(1),
            endDate: z.string().min(1),
          }),
        )
        .min(1),
      defaultBusy: z
        .array(
          z.object({
            day: z.number().min(0).max(6),
            start: z.string(),
            end: z.string(),
          }),
        )
        .optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const {
      resumeUrl,
      interests,
      activities,
      experience,
      education,
      defaultBusy,
    } = parsed.data;
    const availabilityDefaults = defaultBusy || [];
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { flags: true },
    });
    const flags = {
      ...(existing?.flags as any || {}),
      ...(availabilityDefaults ? { defaultBusy: availabilityDefaults } : {}),
    };
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role, firstName, lastName, timezone, flags },
    });
    await prisma.candidateProfile.upsert({
      where: { userId: session.user.id },
      update: {
        resumeUrl: resumeUrl || undefined,
        interests,
        activities,
        experience: {
          deleteMany: {},
          create: experience.map((e) => ({
            firm: e.firm,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
          })),
        },
        education: {
          deleteMany: {},
          create: education.map((e) => ({
            school: e.school,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
          })),
        },
      },
      create: {
        userId: session.user.id,
        resumeUrl: resumeUrl || undefined,
        interests,
        activities,
        experience: {
          create: experience.map((e) => ({
            firm: e.firm,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
          })),
        },
        education: {
          create: education.map((e) => ({
            school: e.school,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
          })),
        },
      },
    });
    await ensureCustomer(
      session.user.id,
      session.user.email || '',
      formatFullName(firstName, lastName),
    );
  } else {
    const schema = base.extend({
      employer: z.string(),
      title: z.string(),
      bio: z.string(),
      priceUSD: z.number(),
      corporateEmail: z.string().email(),
      interests: z.array(z.string().min(1)).min(1),
      activities: z.array(z.string().min(1)).min(1),
      experience: z
        .array(
          z.object({
            firm: z.string().min(1),
            title: z.string().min(1),
            startDate: z.string().min(1),
            endDate: z.string().min(1),
          }),
        )
        .min(1),
      education: z
        .array(
          z.object({
            school: z.string().min(1),
            title: z.string().min(1),
            startDate: z.string().min(1),
            endDate: z.string().min(1),
          }),
        )
        .min(1),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const {
      employer,
      title,
      bio,
      priceUSD,
      corporateEmail,
      interests,
      activities,
      experience,
      education,
    } = parsed.data;
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { corporateEmailVerified: true },
    });
    if (!userRecord?.corporateEmailVerified) {
      return NextResponse.json(
        { error: 'email_not_verified' },
        { status: 400 },
      );
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role, firstName, lastName, timezone },
    });
    await prisma.professionalProfile.upsert({
      where: { userId: session.user.id },
      update: {
        employer,
        title,
        bio,
        priceUSD,
        corporateEmail,
        interests,
        activities,
        experience: {
          deleteMany: {},
          create: experience.map((e) => ({
            firm: e.firm,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
          })),
        },
        education: {
          deleteMany: {},
          create: education.map((e) => ({
            school: e.school,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
          })),
        },
      },
      create: {
        userId: session.user.id,
        employer,
        title,
        bio,
        priceUSD,
        corporateEmail,
        interests,
        activities,
        experience: {
          create: experience.map((e) => ({
            firm: e.firm,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
          })),
        },
        education: {
          create: education.map((e) => ({
            school: e.school,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
          })),
        },
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
});
