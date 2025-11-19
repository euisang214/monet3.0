import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/core/db';
import { withAuth } from '@/lib/core/api-helpers';
import { rateLimit } from '@/lib/core/rate-limit';
import { sendEmail } from '@/lib/integrations/email';
import {
  createEmailTemplate,
  createPlainTextFallback,
  createInfoBox,
  getDefaultFromAddress,
  getAppUrl,
} from '@/lib/integrations/email-templates';

const requestSchema = z.object({
  corporateEmail: z.string().email('Please enter a valid email address'),
});

// Token expires in 24 hours
const TOKEN_EXPIRY_HOURS = 24;

export const POST = withAuth(async (session, req: NextRequest) => {
  // Rate limit: max 5 verification requests per minute per user
  if (!rateLimit(`verification:${session.user.id}`, 5)) {
    return NextResponse.json(
      { error: 'too_many_requests', message: 'Please wait before requesting another verification email.' },
      { status: 429 }
    );
  }

  // Validate request body
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', message: parsed.error.errors[0]?.message || 'Invalid email address' },
      { status: 400 }
    );
  }

  const { corporateEmail } = parsed.data;

  // Check if this email is already verified by another user
  const existingProfile = await prisma.professionalProfile.findFirst({
    where: {
      corporateEmail,
      verifiedAt: { not: null },
      userId: { not: session.user.id },
    },
  });

  if (existingProfile) {
    return NextResponse.json(
      { error: 'email_in_use', message: 'This corporate email is already verified by another user.' },
      { status: 400 }
    );
  }

  // Check if user already has verified this email
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { corporateEmailVerified: true, firstName: true },
  });

  if (user?.corporateEmailVerified) {
    // Check if they're trying to verify a different email
    const existingVerification = await prisma.verification.findFirst({
      where: {
        userId: session.user.id,
        verifiedAt: { not: null },
      },
    });

    if (existingVerification && existingVerification.corporateEmail === corporateEmail) {
      return NextResponse.json(
        { error: 'already_verified', message: 'This email is already verified.' },
        { status: 400 }
      );
    }
  }

  // Invalidate any existing pending verifications for this user
  await prisma.verification.deleteMany({
    where: {
      userId: session.user.id,
      verifiedAt: null,
    },
  });

  // Generate secure token and expiration
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Create verification record
  await prisma.verification.create({
    data: {
      userId: session.user.id,
      corporateEmail,
      token,
      expiresAt,
    },
  });

  // Build verification URL
  const appUrl = getAppUrl();
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  // Create email content
  const greeting = user?.firstName
    ? `Hi ${user.firstName},`
    : 'Hi there,';

  const emailBody = `
    <p style="margin: 0 0 16px 0;">
      Thank you for signing up as a professional on Monet. To complete your registration and start receiving booking requests, please verify your corporate email address.
    </p>

    ${createInfoBox(`
      <p style="margin: 0; font-size: 14px; color: #475569;">
        <strong>Email to verify:</strong><br>
        ${corporateEmail}
      </p>
    `)}

    <p style="margin: 16px 0;">
      Click the button below to verify your email address. This link will expire in <strong>${TOKEN_EXPIRY_HOURS} hours</strong>.
    </p>
  `;

  const htmlContent = createEmailTemplate({
    title: 'Verify Your Corporate Email - Monet',
    preheader: 'Complete your Monet professional registration by verifying your corporate email.',
    greeting,
    body: emailBody,
    ctaText: 'Verify Email Address',
    ctaUrl: verificationUrl,
    footer: 'If you did not create a Monet account, you can safely ignore this email.',
  });

  const textContent = createPlainTextFallback({
    greeting,
    body: `Thank you for signing up as a professional on Monet. To complete your registration, please verify your corporate email address (${corporateEmail}).\n\nThis link will expire in ${TOKEN_EXPIRY_HOURS} hours.`,
    ctaText: 'Verify Email Address',
    ctaUrl: verificationUrl,
    footer: 'If you did not create a Monet account, you can safely ignore this email.',
  });

  // Send verification email
  await sendEmail({
    from: getDefaultFromAddress(),
    to: corporateEmail,
    subject: 'Verify Your Corporate Email - Monet',
    text: textContent,
    html: htmlContent,
  });

  return NextResponse.json({
    ok: true,
    message: 'Verification email sent. Please check your inbox.',
  });
});
