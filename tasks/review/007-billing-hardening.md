# Task 007 - Billing Hardening

## Objective

Audit, complete and harden Billing for V1 across both layers:

1. Clinic ↔ Patient
2. Nortex ↔ Clinic

## Files Created

- `apps/web/features/billing/services/billing-status.ts`
- `apps/web/tests/billing/billing-hardening.test.ts`
- `tasks/review/007-billing-hardening.md`

## Files Modified

- `apps/web/features/billing/actions/mark-patient-invoice-paid.ts`
- `apps/web/features/billing/actions/mark-patient-invoice-overdue.ts`
- `apps/web/features/billing/actions/mark-clinic-invoice-paid.ts`
- `apps/web/features/billing/actions/mark-clinic-invoice-overdue.ts`
- `apps/web/features/billing/components/billing-page.tsx`
- `apps/web/features/billing/services/billing-foundation.ts`
- `apps/web/package.json`
- `package.json`

## What Was Implemented

- Added explicit invoice transition guardrails for both patient and clinic billing.
- Made `mark paid` idempotent so repeated submissions do not create duplicate payment rows.
- Restricted `mark overdue` to pending invoices only.
- Blocked invalid transitions from finalized statuses.
- Extended billing overview to expose:
  - linked patient subscription status
  - linked clinic subscription status
  - payment history presence
- Clarified canceled-subscription behavior by keeping invoice history visible with the linked canceled subscription state.
- Added `pnpm test:billing` regression coverage for patient billing, SaaS billing, RBAC and tenant scoping.

## Decisions Made

- Kept billing fully manual for V1.
- Preserved invoice history after subscription cancelation instead of deleting or hiding records.
- Treated repeated “mark paid” requests as harmless no-ops once the paid state exists.

## Intentionally Left Out

- No payment gateway integration.
- No automatic recurring billing.
- No refunds workflow beyond existing status enums.
- No external export or reconciliation tooling.

## Risks

- Payment operations remain manual and depend on operator accuracy.
- Billing status transitions are intentionally simple and may need future expansion for refunds and failed-settlement workflows.

## Validation

- `pnpm test:billing` ✅
- `pnpm test:contracts` ✅
- `pnpm test:membership` ✅
- `pnpm test:tenant` ✅
- `pnpm test:rbac` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm lint` ✅
