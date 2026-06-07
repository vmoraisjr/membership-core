ALTER TABLE "PatientContract"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TYPE "PatientContractStatus"
RENAME TO "PatientContractStatus_old";

CREATE TYPE "PatientContractStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'ACCEPTED',
  'ARCHIVED'
);

ALTER TABLE "PatientContract"
ALTER COLUMN "status"
TYPE "PatientContractStatus"
USING (
  CASE
    WHEN "status"::text = 'PENDING_ACCEPTANCE' THEN 'ACTIVE'
    WHEN "status"::text = 'ACCEPTED' THEN 'ACCEPTED'
    WHEN "status"::text = 'CANCELED' THEN 'ARCHIVED'
    WHEN "status"::text = 'EXPIRED' THEN 'ARCHIVED'
    ELSE 'ACTIVE'
  END
)::"PatientContractStatus";

DROP TYPE "PatientContractStatus_old";

ALTER TABLE "PatientContract"
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
