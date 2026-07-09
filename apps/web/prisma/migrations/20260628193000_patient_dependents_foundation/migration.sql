CREATE TYPE "PatientKind" AS ENUM ('TITULAR', 'DEPENDENT');

ALTER TABLE "Patient"
ADD COLUMN "kind" "PatientKind" NOT NULL DEFAULT 'TITULAR',
ADD COLUMN "responsiblePatientId" TEXT;

CREATE INDEX "Patient_clinicId_kind_idx" ON "Patient"("clinicId", "kind");
CREATE INDEX "Patient_responsiblePatientId_idx" ON "Patient"("responsiblePatientId");

ALTER TABLE "Patient"
ADD CONSTRAINT "Patient_responsiblePatientId_fkey"
FOREIGN KEY ("responsiblePatientId") REFERENCES "Patient"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
