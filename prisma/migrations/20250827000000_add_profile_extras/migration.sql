-- Add array fields to profiles and create experience/education tables

-- CandidateProfile: add interests and activities, remove JSON fields
ALTER TABLE "CandidateProfile"
  ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  ADD COLUMN "activities" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;

ALTER TABLE "CandidateProfile"
  DROP COLUMN IF EXISTS "experience",
  DROP COLUMN IF EXISTS "education";

-- ProfessionalProfile: add interests and activities
ALTER TABLE "ProfessionalProfile"
  ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  ADD COLUMN "activities" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;

-- Experience table
CREATE TABLE "Experience" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "firm" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "professionalId" TEXT,
  "candidateId" TEXT,
  CONSTRAINT "Experience_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Experience_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Education table
CREATE TABLE "Education" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "school" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "professionalId" TEXT,
  "candidateId" TEXT,
  CONSTRAINT "Education_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Education_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE
);
