-- CreateEnum
CREATE TYPE "BillingProviderKind" AS ENUM ('MANUAL', 'FAKE');

-- CreateEnum
CREATE TYPE "BillingSyncStatus" AS ENUM ('SYNCED', 'PENDING', 'DIVERGED');

-- AlterTable
ALTER TABLE "ClinicSubscription"
ADD COLUMN "providerKind" "BillingProviderKind" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "externalCustomerId" TEXT,
ADD COLUMN "externalSubscriptionId" TEXT,
ADD COLUMN "syncStatus" "BillingSyncStatus" NOT NULL DEFAULT 'SYNCED',
ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN "paymentRetryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "nextPaymentAttemptAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicSubscription_externalSubscriptionId_key" ON "ClinicSubscription"("externalSubscriptionId");
