# Task 014 - Patient Benefit Use Action

## Objective

Add a direct patient-row action for benefit usage without weakening tenant or
RBAC protections.

## Files Created

- `tasks/review/014-patient-benefit-use-action.md`

## Files Modified

- `apps/web/features/benefit-usage/components/consume-benefit-dialog.tsx`
- `apps/web/features/patients/components/patient-row-actions.tsx`
- `apps/web/features/patients/components/patients-page.tsx`
- `apps/web/features/patients/components/patients-table.tsx`

## What Was Implemented

- Reused the existing benefit consumption dialog as a configurable trigger-based
  component.
- Added a direct row action for benefit usage in the patient roster.
- Scoped available benefit options to the selected patient's active
  subscription balances.
- Kept the action hidden for inactive patients by only enabling it on active
  rows.
- Kept tenant isolation and RBAC enforcement in the existing benefit
  consumption action path.

## Decisions Made

- Reused `getPatientBenefitBalance()` instead of introducing a second patient
  benefit query path.
- Reused the current `consumeBenefit()` action so monthly limits, inactive
  benefit checks, inactive subscription checks and audit logging remain
  centralized.

## Risks

- The row action currently relies on server-provided balances, so any future
  subscription status rule changes should stay aligned with
  `getPatientBenefitBalance()`.

## Validation

- `pnpm test:tenant` OK
- `pnpm test:rbac` OK
- `pnpm test:membership` OK
- `pnpm test:audit` OK
- `pnpm lint` OK
- `pnpm --dir apps/web typecheck` OK
