CREATE TYPE "PaymentMethod" AS ENUM (
  'CARD',
  'PIX',
  'CASH',
  'BANK_TRANSFER',
  'OTHER'
);

ALTER TABLE "PatientInvoice"
ALTER COLUMN "paymentMethod" TYPE "PaymentMethod"
USING (
  CASE
    WHEN "paymentMethod" IS NULL THEN NULL
    ELSE "paymentMethod"::"PaymentMethod"
  END
);

ALTER TABLE "PatientPayment"
ALTER COLUMN "paymentMethod" TYPE "PaymentMethod"
USING (
  CASE
    WHEN "paymentMethod" IS NULL THEN NULL
    ELSE "paymentMethod"::"PaymentMethod"
  END
);
