-- Drop existing view to allow column removal
DROP VIEW IF EXISTS "ListingCardView";

-- Remove seniority column from ProfessionalProfile
ALTER TABLE "ProfessionalProfile" DROP COLUMN IF EXISTS "seniority";

-- Drop associated index if it exists
DROP INDEX IF EXISTS "ProfessionalProfile_seniority_idx";

-- Recreate view without seniority column
CREATE VIEW "ListingCardView" AS
SELECT u.id as "userId", p.employer, p.title, p."priceUSD", ARRAY[]::text[] as tags
FROM "User" u
JOIN "ProfessionalProfile" p ON p."userId" = u.id
WHERE u.role = 'PROFESSIONAL';

