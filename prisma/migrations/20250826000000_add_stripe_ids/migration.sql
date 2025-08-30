-- Add Stripe columns to User table
ALTER TABLE "User"
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeAccountId" TEXT;
