# Task 006 - Contracts Operational Completion

## Objective

Complete the Contracts module so it is operationally usable in production V1
without turning it into a full legal platform.

## Files Created

- `apps/web/features/contracts/actions/activate-contract-template.ts`
- `apps/web/features/contracts/actions/deactivate-contract-template.ts`
- `apps/web/features/contracts/actions/update-patient-contract-status.ts`
- `apps/web/features/contracts/schemas/patient-contract.schema.ts`
- `apps/web/prisma/migrations/20260606221500_contracts_operational_completion/migration.sql`
- `tasks/review/006-contracts-operational-completion.md`

## Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/seed.ts`
- `apps/web/features/contracts/services/contracts-foundation.ts`
- `apps/web/features/contracts/actions/accept-patient-contract.ts`
- `apps/web/features/contracts/actions/save-contract-template.ts`
- `apps/web/features/contracts/components/contracts-page.tsx`
- `apps/web/features/contracts/schemas/contract-template.schema.ts`
- `apps/web/tests/contracts/contracts-hardening.test.ts`
- `apps/web/tests/tenant-isolation/cross-tenant-regression.test.ts`
- `apps/web/tests/rbac/rbac-hardening.test.ts`

## What Was Implemented

- Reworked the patient contract lifecycle to the requested V1 states:
  - `DRAFT`
  - `ACTIVE`
  - `ACCEPTED`
  - `ARCHIVED`
- Migrated existing patient contract records from the old lifecycle safely:
  - `PENDING_ACCEPTANCE -> ACTIVE`
  - `CANCELED -> ARCHIVED`
  - `EXPIRED -> ARCHIVED`
- Added clinic template operations for:
  - creating new clinic-specific templates
  - editing existing clinic-specific templates
  - activating one clinic template per contract type for future use
  - deactivating a clinic template and falling back to the default template
- Added patient contract lifecycle management for:
  - `DRAFT -> ACTIVE`
  - `DRAFT -> ARCHIVED`
  - `ACTIVE -> ARCHIVED`
  - `ACCEPTED -> ARCHIVED`
- Kept patient contract acceptance as the only path into `ACCEPTED`.
- Hardened subscription-to-contract linkage validation so a contract cannot be
  generated for a mismatched `clinicId`, `patientId`, and `subscriptionId`.

## Decisions Made

- Generated patient contracts now start as `ACTIVE`, which keeps the existing
  subscription enrollment flow operational in V1 while still supporting the
  broader lifecycle.
- Template selection is implemented operationally through template activation:
  one clinic template per type can be active for future contracts at a time.
- Deactivating a clinic template does not mutate historical contract snapshots;
  future contracts simply fall back to the default template when no clinic
  template is active.

## What Was Intentionally Left Out

- No PDF generation.
- No external e-signature integration.
- No legal versioning or redlining workflow.
- No retroactive rewrite of already-generated contract snapshots.

## Risks

- Patient contract creation still relies on the subscription flow rather than a
  separate manual drafting workflow, so `DRAFT` is supported operationally but
  not exposed as a standalone contract-creation path.
- Template activation is intentionally simple and clinic-scoped; if future work
  needs approval or publishing workflows, that should be added as a new layer
  rather than folded into this V1 surface.

## Validation

- `pnpm --dir apps/web exec prisma migrate deploy` ✅
- `pnpm prisma generate` from `apps/web` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm test:contracts` ✅
- `pnpm test:tenant` ✅
- `pnpm test:rbac` ✅
- `pnpm test:membership` ✅
- `pnpm lint` ✅
