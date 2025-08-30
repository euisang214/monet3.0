-- CreateTable
CREATE TABLE "Availability" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "start" TIMESTAMP NOT NULL,
  "end" TIMESTAMP NOT NULL,
  "busy" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "Availability_userId_start_idx" ON "Availability"("userId","start");
