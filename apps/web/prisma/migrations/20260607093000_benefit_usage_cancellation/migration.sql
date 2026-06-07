CREATE TYPE "BenefitUsageStatus" AS ENUM ('ACTIVE', 'CANCELED');

ALTER TABLE "BenefitUsage"
ADD COLUMN "status" "BenefitUsageStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "canceledAt" TIMESTAMP(3);

CREATE INDEX "BenefitUsage_status_usedAt_idx" ON "BenefitUsage"("status", "usedAt");
