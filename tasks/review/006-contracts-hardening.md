# Task 006 - Contracts Hardening

## Objective

Audit, complete and harden the V1 contracts module without expanding it into a full e-signature platform.

## Files Created

- `apps/web/features/contracts/actions/add-clinic-contract-file-reference.ts`
- `apps/web/features/contracts/actions/save-contract-template.ts`
- `apps/web/features/contracts/actions/update-clinic-contract-status.ts`
- `apps/web/features/contracts/schemas/clinic-contract.schema.ts`
- `apps/web/features/contracts/schemas/contract-template.schema.ts`
- `apps/web/tests/contracts/contracts-hardening.test.ts`
- `tasks/review/006-contracts-hardening.md`

## Files Modified

- `apps/web/features/contracts/actions/accept-patient-contract.ts`
- `apps/web/features/contracts/components/contracts-page.tsx`
- `apps/web/features/contracts/services/contracts-foundation.ts`
- `apps/web/package.json`
- `package.json`

## What Was Implemented

- Hardened contract template resolution so clinic-specific templates are used for that clinic only, with correct fallback to global defaults.
- Added a simple V1 template management flow for:
  - patient membership contracts
  - clinic platform contracts
- Added clinic-contract lifecycle mutation with guarded V1 transitions.
- Added clinic-contract file reference support using stored URL references only.
- Hardened patient-contract acceptance to reject canceled or expired contracts while remaining idempotent for already-accepted records.
- Added a dedicated `pnpm test:contracts` regression suite.

## Decisions Made

- Kept contracts snapshot-based and intentionally avoided versioning or external signature workflows.
- Treated file handling as URL reference registration only.
- Limited clinic contract lifecycle to simple V1 transitions:
  - `PENDING_SIGNATURE -> ACTIVE | CANCELED`
  - `ACTIVE -> SUSPENDED | CANCELED`
  - `SUSPENDED -> ACTIVE | CANCELED`

## Intentionally Left Out

- No PDF generation.
- No external signature provider.
- No advanced legal workflow automation.
- No retroactive mutation of already-generated patient contract snapshots after template changes.

## Risks

- Template changes affect only future generated contracts and future clinic records, not historical snapshots.
- Clinic contract lifecycle remains intentionally simple and manually operated.
- Contract file references depend on externally managed URLs.

## Validation

- `pnpm test:contracts` ✅
- `pnpm test:tenant` ✅
- `pnpm test:rbac` ✅
- `pnpm test:membership` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm lint` ✅ after removing one unused test import warning
