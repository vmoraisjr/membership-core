-- CreateTable
CREATE TABLE "BillingWebhookEvent" (
  "id" TEXT NOT NULL,
  "externalEventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "clinicId" TEXT,
  "externalSubscriptionId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "error" TEXT,

  CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingWebhookEvent_externalEventId_key" ON "BillingWebhookEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_clinicId_idx" ON "BillingWebhookEvent"("clinicId");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_externalSubscriptionId_idx" ON "BillingWebhookEvent"("externalSubscriptionId");
