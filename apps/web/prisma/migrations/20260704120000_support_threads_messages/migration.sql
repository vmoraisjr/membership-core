CREATE TYPE "SupportThreadStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CLINIC',
  'WAITING_PLATFORM',
  'RESOLVED',
  'CLOSED'
);

CREATE TYPE "SupportThreadCategory" AS ENUM (
  'INCIDENT',
  'REQUEST',
  'PAYMENT',
  'REGISTRATION',
  'OTHER'
);

CREATE TYPE "SupportActorScope" AS ENUM (
  'PLATFORM',
  'CLINIC'
);

ALTER TYPE "AuditEntity"
ADD VALUE IF NOT EXISTS 'SUPPORT_THREAD';

ALTER TYPE "AuditEntity"
ADD VALUE IF NOT EXISTS 'SUPPORT_MESSAGE';

CREATE TABLE "SupportThread" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "category" "SupportThreadCategory" NOT NULL,
  "status" "SupportThreadStatus" NOT NULL DEFAULT 'OPEN',
  "createdByUserId" TEXT,
  "createdByScope" "SupportActorScope" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "authorUserId" TEXT,
  "authorScope" "SupportActorScope" NOT NULL,
  "authorName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportThread_clinicId_status_updatedAt_idx" ON "SupportThread"("clinicId", "status", "updatedAt");
CREATE INDEX "SupportThread_createdByUserId_idx" ON "SupportThread"("createdByUserId");
CREATE INDEX "SupportMessage_threadId_createdAt_idx" ON "SupportMessage"("threadId", "createdAt");
CREATE INDEX "SupportMessage_clinicId_createdAt_idx" ON "SupportMessage"("clinicId", "createdAt");

ALTER TABLE "SupportThread"
ADD CONSTRAINT "SupportThread_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportThread"
ADD CONSTRAINT "SupportThread_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "SupportThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_authorUserId_fkey"
FOREIGN KEY ("authorUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
