-- AlterEnum
ALTER TYPE "ClinicSubscriptionStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

-- AlterTable
ALTER TABLE "ClinicSubscription"
ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
