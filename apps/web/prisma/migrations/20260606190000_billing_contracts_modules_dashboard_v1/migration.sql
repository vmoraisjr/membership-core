CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELED',
    'FAILED',
    'REFUNDED'
);

CREATE TYPE "BillingCycle" AS ENUM (
    'MONTHLY',
    'ANNUAL',
    'MANUAL'
);

CREATE TYPE "ClinicSubscriptionStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'SUSPENDED',
    'CANCELED'
);

CREATE TYPE "ModuleKey" AS ENUM (
    'MEMBERSHIP',
    'CRM',
    'SCHEDULING',
    'COMMUNICATION',
    'PATIENT_PORTAL',
    'ANALYTICS'
);

CREATE TYPE "ModuleStatus" AS ENUM (
    'ENABLED',
    'DISABLED'
);

CREATE TYPE "ContractType" AS ENUM (
    'PATIENT_MEMBERSHIP',
    'CLINIC_PLATFORM'
);

CREATE TYPE "PatientContractStatus" AS ENUM (
    'PENDING_ACCEPTANCE',
    'ACCEPTED',
    'CANCELED',
    'EXPIRED'
);

CREATE TYPE "ClinicContractStatus" AS ENUM (
    'DRAFT',
    'PENDING_SIGNATURE',
    'ACTIVE',
    'SUSPENDED',
    'CANCELED',
    'EXPIRED'
);

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MARK_INVOICE_PAID';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MARK_INVOICE_OVERDUE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCEPT_CONTRACT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ENABLE_MODULE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DISABLE_MODULE';

ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'PATIENT_INVOICE';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'PATIENT_PAYMENT';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'CLINIC_BILLING_PLAN';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'CLINIC_SUBSCRIPTION';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'CLINIC_INVOICE';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'CLINIC_PAYMENT';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'MODULE';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'CLINIC_MODULE';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'CONTRACT_TEMPLATE';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'PATIENT_CONTRACT';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'CLINIC_CONTRACT';

CREATE TABLE "PatientInvoice" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "billingCycle" "BillingCycle" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientPayment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientInvoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "confirmedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicBillingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION,
    "annualPrice" DOUBLE PRECISION,
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicBillingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicSubscription" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "clinicBillingPlanId" TEXT NOT NULL,
    "status" "ClinicSubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicInvoice" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "clinicSubscriptionId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicPayment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "clinicInvoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "confirmedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "key" "ModuleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isV1Active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicModule" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "ModuleStatus" NOT NULL DEFAULT 'ENABLED',
    "enabledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicModule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "type" "ContractType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientContract" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "contentSnapshot" TEXT NOT NULL,
    "status" "PatientContractStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientContractAcceptance" (
    "id" TEXT NOT NULL,
    "patientContractId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientContractAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicContract" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "contentSnapshot" TEXT NOT NULL,
    "status" "ClinicContractStatus" NOT NULL DEFAULT 'PENDING_SIGNATURE',
    "effectiveAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicContractFile" (
    "id" TEXT NOT NULL,
    "clinicContractId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicContractFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Module_key_key" ON "Module"("key");
CREATE UNIQUE INDEX "ClinicModule_clinicId_moduleId_key" ON "ClinicModule"("clinicId", "moduleId");

CREATE INDEX "PatientInvoice_clinicId_status_dueDate_idx" ON "PatientInvoice"("clinicId", "status", "dueDate");
CREATE INDEX "PatientInvoice_patientId_status_idx" ON "PatientInvoice"("patientId", "status");
CREATE INDEX "PatientInvoice_subscriptionId_idx" ON "PatientInvoice"("subscriptionId");
CREATE INDEX "PatientPayment_clinicId_paidAt_idx" ON "PatientPayment"("clinicId", "paidAt");
CREATE INDEX "PatientPayment_patientInvoiceId_idx" ON "PatientPayment"("patientInvoiceId");
CREATE INDEX "ClinicSubscription_clinicId_status_idx" ON "ClinicSubscription"("clinicId", "status");
CREATE INDEX "ClinicInvoice_clinicId_status_dueDate_idx" ON "ClinicInvoice"("clinicId", "status", "dueDate");
CREATE INDEX "ClinicPayment_clinicId_paidAt_idx" ON "ClinicPayment"("clinicId", "paidAt");
CREATE INDEX "ClinicPayment_clinicInvoiceId_idx" ON "ClinicPayment"("clinicInvoiceId");
CREATE INDEX "ClinicModule_clinicId_status_idx" ON "ClinicModule"("clinicId", "status");
CREATE INDEX "ContractTemplate_clinicId_type_active_idx" ON "ContractTemplate"("clinicId", "type", "active");
CREATE INDEX "PatientContract_clinicId_status_idx" ON "PatientContract"("clinicId", "status");
CREATE INDEX "PatientContract_subscriptionId_idx" ON "PatientContract"("subscriptionId");
CREATE INDEX "PatientContractAcceptance_patientContractId_acceptedAt_idx" ON "PatientContractAcceptance"("patientContractId", "acceptedAt");
CREATE INDEX "ClinicContract_clinicId_status_idx" ON "ClinicContract"("clinicId", "status");

ALTER TABLE "PatientInvoice"
ADD CONSTRAINT "PatientInvoice_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PatientInvoice"
ADD CONSTRAINT "PatientInvoice_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PatientInvoice"
ADD CONSTRAINT "PatientInvoice_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientPayment"
ADD CONSTRAINT "PatientPayment_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PatientPayment"
ADD CONSTRAINT "PatientPayment_patientInvoiceId_fkey"
FOREIGN KEY ("patientInvoiceId") REFERENCES "PatientInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientPayment"
ADD CONSTRAINT "PatientPayment_confirmedByUserId_fkey"
FOREIGN KEY ("confirmedByUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClinicSubscription"
ADD CONSTRAINT "ClinicSubscription_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicSubscription"
ADD CONSTRAINT "ClinicSubscription_clinicBillingPlanId_fkey"
FOREIGN KEY ("clinicBillingPlanId") REFERENCES "ClinicBillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicInvoice"
ADD CONSTRAINT "ClinicInvoice_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicInvoice"
ADD CONSTRAINT "ClinicInvoice_clinicSubscriptionId_fkey"
FOREIGN KEY ("clinicSubscriptionId") REFERENCES "ClinicSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicPayment"
ADD CONSTRAINT "ClinicPayment_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicPayment"
ADD CONSTRAINT "ClinicPayment_clinicInvoiceId_fkey"
FOREIGN KEY ("clinicInvoiceId") REFERENCES "ClinicInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicPayment"
ADD CONSTRAINT "ClinicPayment_confirmedByUserId_fkey"
FOREIGN KEY ("confirmedByUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClinicModule"
ADD CONSTRAINT "ClinicModule_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicModule"
ADD CONSTRAINT "ClinicModule_moduleId_fkey"
FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractTemplate"
ADD CONSTRAINT "ContractTemplate_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientContract"
ADD CONSTRAINT "PatientContract_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientContract"
ADD CONSTRAINT "PatientContract_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientContract"
ADD CONSTRAINT "PatientContract_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientContract"
ADD CONSTRAINT "PatientContract_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientContractAcceptance"
ADD CONSTRAINT "PatientContractAcceptance_patientContractId_fkey"
FOREIGN KEY ("patientContractId") REFERENCES "PatientContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientContractAcceptance"
ADD CONSTRAINT "PatientContractAcceptance_acceptedByUserId_fkey"
FOREIGN KEY ("acceptedByUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClinicContract"
ADD CONSTRAINT "ClinicContract_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicContract"
ADD CONSTRAINT "ClinicContract_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClinicContractFile"
ADD CONSTRAINT "ClinicContractFile_clinicContractId_fkey"
FOREIGN KEY ("clinicContractId") REFERENCES "ClinicContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
