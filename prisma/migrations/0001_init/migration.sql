-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDATE', 'PROFESSIONAL');

CREATE TYPE "BookingStatus" AS ENUM ('draft','requested','accepted','cancelled','completed','completed_pending_feedback','refunded');
CREATE TYPE "PaymentStatus" AS ENUM ('held','released','refunded');
CREATE TYPE "PayoutStatus" AS ENUM ('pending','paid','blocked');
CREATE TYPE "QCStatus" AS ENUM ('passed','revise','failed','missing');

-- CreateTable: User
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "hashedPassword" TEXT,
  "role" "Role" NOT NULL,
  "googleCalendarConnected" BOOLEAN NOT NULL DEFAULT false,
  "linkedinConnected" BOOLEAN NOT NULL DEFAULT false,
  "corporateEmailVerified" BOOLEAN NOT NULL DEFAULT false,
  "flags" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- OAuthAccount
CREATE TABLE "OAuthAccount" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP,
  "scope" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("provider","providerAccountId")
);

-- ProfessionalProfile
CREATE TABLE "ProfessionalProfile" (
  "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "employer" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "seniority" TEXT NOT NULL,
  "bio" TEXT NOT NULL,
  "priceUSD" INTEGER NOT NULL,
  "availabilityPrefs" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "verifiedAt" TIMESTAMP,
  "corporateEmail" TEXT
);

-- CandidateProfile
CREATE TABLE "CandidateProfile" (
  "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "experience" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "education" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "resumeUrl" TEXT
);

-- Booking
CREATE TABLE "Booking" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "candidateId" TEXT NOT NULL REFERENCES "User"("id"),
  "professionalId" TEXT NOT NULL REFERENCES "User"("id"),
  "status" "BookingStatus" NOT NULL,
  "startAt" TIMESTAMP NOT NULL,
  "endAt" TIMESTAMP NOT NULL,
  "zoomMeetingId" TEXT,
  "zoomJoinUrl" TEXT,
  "calendarEventIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "Booking_status_startAt_idx" ON "Booking" ("status","startAt");

-- Payment
CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookingId" TEXT NOT NULL UNIQUE REFERENCES "Booking"("id") ON DELETE CASCADE,
  "amountGross" INTEGER NOT NULL,
  "platformFee" INTEGER NOT NULL,
  "escrowHoldId" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Feedback
CREATE TABLE "Feedback" (
  "bookingId" TEXT PRIMARY KEY REFERENCES "Booking"("id") ON DELETE CASCADE,
  "starsCategory1" INTEGER NOT NULL,
  "starsCategory2" INTEGER NOT NULL,
  "starsCategory3" INTEGER NOT NULL,
  "extraCategoryRatings" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "wordCount" INTEGER NOT NULL,
  "actions" TEXT[] NOT NULL,
  "text" TEXT NOT NULL,
  "submittedAt" TIMESTAMP NOT NULL,
  "qcStatus" "QCStatus" NOT NULL,
  "qcReport" JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Payout
CREATE TABLE "Payout" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookingId" TEXT NOT NULL UNIQUE REFERENCES "Booking"("id") ON DELETE CASCADE,
  "proStripeAccountId" TEXT NOT NULL,
  "amountNet" INTEGER NOT NULL,
  "status" "PayoutStatus" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- SuccessFeeInvoice
CREATE TABLE "SuccessFeeInvoice" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "candidateId" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "percentage" INTEGER NOT NULL DEFAULT 10,
  "declaredBonusAmount" INTEGER NOT NULL,
  "invoiceAmount" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Verification
CREATE TABLE "Verification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "corporateEmail" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Notification
CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "scheduledFor" TIMESTAMP NOT NULL,
  "sentAt" TIMESTAMP,
  CONSTRAINT Notification_userId_fkey FOREIGN KEY ("userId") REFERENCES "User"("id")
);
CREATE INDEX "Notification_scheduledFor_idx" ON "Notification" ("scheduledFor");

-- AuditLog
CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" TEXT,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- ListingCardView (view)
CREATE VIEW "ListingCardView" AS
SELECT u.id as "userId", p.employer, p.title, p.seniority, p.priceUSD, ARRAY[]::text[] as tags
FROM "User" u
JOIN "ProfessionalProfile" p ON p."userId" = u.id
WHERE u.role = 'PROFESSIONAL';
