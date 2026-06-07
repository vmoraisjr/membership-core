# Task 013 - Patient Profile and Transaction History

## Objective

Create a tenant-safe patient detail page with operational history and a
patient-scoped timeline.

## Files Created

- `apps/web/app/(dashboard)/dashboard/patients/[patientId]/page.tsx`
- `tasks/review/013-patient-profile-and-transaction-history.md`

## Files Modified

- `apps/web/features/patients/components/patients-table.tsx`
- `apps/web/features/patients/services/get-patient-profile.ts`
- `apps/web/tests/membership/membership-regression.test.ts`
- `apps/web/tests/tenant-isolation/cross-tenant-regression.test.ts`

## What Was Implemented

- Connected the patient name in the roster to `/dashboard/patients/[patientId]`.
- Activated the existing patient profile surface through a real dashboard route.
- Kept patient detail access tenant-scoped by loading only records that belong to
  the current clinic.
- Expanded patient timeline filtering to include invoice-related metadata and
  patient payment entities when present.
- Preserved historical visibility for canceled benefit usages and prior
  subscription events inside the patient profile.

## Regression Coverage

- Added tenant regression coverage proving Alpha cannot access Beta patient
  detail.
- Added patient-profile regression coverage proving the timeline remains tied to
  the selected patient and includes historical canceled usage.

## Risks

- The patient timeline still depends on audit-log metadata consistency, so new
  billing or contract events should continue recording patient/subscription or
  invoice identifiers.

## Validation

- `pnpm test:tenant` OK
- `pnpm test:rbac` OK
- `pnpm test:membership` OK
- `pnpm test:audit` OK
- `pnpm lint` OK
- `pnpm --dir apps/web typecheck` OK
