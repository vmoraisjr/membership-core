ALTER TABLE "AppUser"
ADD COLUMN "accessStartsAt" TIMESTAMP(3),
ADD COLUMN "accessEndsAt" TIMESTAMP(3);

CREATE INDEX "AppUser_clinicId_status_idx" ON "AppUser"("clinicId", "status");
