# Task 016 - Patient Payment Control

## Objective

Complete the V1 patient payment control flow with manual payment methods,
patient invoice cancellation and stronger operational history.

## Files Created

- `apps/web/app/(dashboard)/dashboard/payments/page.tsx`
- `apps/web/features/billing/actions/cancel-patient-invoice.ts`
- `apps/web/features/billing/actions/update-patient-invoice-payment-method.ts`
- `apps/web/prisma/migrations/20260607024500_patient_payment_methods/migration.sql`
- `apps/web/prisma/migrations/20260607025500_payment_method_enum_alignment/migration.sql`
- `tasks/review/016-patient-payment-control.md`

## Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/features/billing/actions/mark-patient-invoice-paid.ts`
- `apps/web/features/billing/components/billing-page.tsx`
- `apps/web/features/billing/services/billing-foundation.ts`
- `apps/web/features/billing/services/billing-status.ts`
- `apps/web/features/patients/components/patient-profile-page.tsx`
- `apps/web/tests/audit/audit-log-hardening.test.ts`
- `apps/web/tests/billing/billing-hardening.test.ts`
- `apps/web/tests/rbac/rbac-hardening.test.ts`

## What Was Implemented

- Added persisted patient payment methods with V1-supported values:
  - `CARD`
  - `PIX`
  - `CASH`
  - `BANK_TRANSFER`
  - `OTHER`
- Added manual invoice payment-method updates for patient invoices.
- Required a valid payment method when marking a patient invoice as paid.
- Added manual patient invoice cancellation for pending and overdue invoices.
- Expanded the billing UI to show:
  - patient
  - plan
  - subscription
  - amount
  - due date
  - status
  - payment date
  - payment method
  - payment history
- Added `/dashboard/payments` as an alias to the billing surface.
- Extended patient profile payment history to include payment method context.

## Decisions Made

- Stored payment method on both `PatientInvoice` and `PatientPayment` so the
  current invoice state and historical paid record stay aligned.
- Reused the existing billing page instead of building a second payments
  surface for V1.

## Risks

- Payment method changes after a payment exists currently synchronize paid
  patient-payment rows for that invoice; future multi-payment support would need
  a more granular history model.

## Validation

- `pnpm --dir apps/web exec prisma migrate deploy` OK
- `pnpm --dir apps/web exec prisma generate` OK
- `pnpm test:tenant` OK
- `pnpm test:rbac` OK
- `pnpm test:membership` OK
- `pnpm test:billing` OK
- `pnpm test:audit` OK
- `pnpm test:contracts` OK
- `pnpm lint` OK
- `pnpm --dir apps/web typecheck` OK
