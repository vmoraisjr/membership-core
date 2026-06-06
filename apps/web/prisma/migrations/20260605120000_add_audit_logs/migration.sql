-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'DEACTIVATE',
    'REACTIVATE',
    'CONSUME_BENEFIT',
    'CANCEL_SUBSCRIPTION',
    'RENEW_SUBSCRIPTION',
    'PAUSE_SUBSCRIPTION',
    'RESUME_SUBSCRIPTION',
    'EXPIRE_SUBSCRIPTION'
);

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM (
    'CLINIC',
    'PATIENT',
    'MEMBERSHIP_PLAN',
    'MEMBERSHIP_BENEFIT',
    'SUBSCRIPTION',
    'BENEFIT_USAGE'
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "actor" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" "AuditEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityLabel" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_createdAt_idx" ON "AuditLog"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_actor_idx" ON "AuditLog"("clinicId", "actor");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_entity_idx" ON "AuditLog"("clinicId", "entity");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
