ALTER TABLE "PatientInvoice"
ADD COLUMN "paymentMethod" TEXT;

ALTER TABLE "PatientPayment"
ADD COLUMN "paymentMethod" TEXT;
