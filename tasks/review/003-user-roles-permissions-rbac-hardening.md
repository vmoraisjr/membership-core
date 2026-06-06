# Task 003 - User Roles & Permissions (RBAC Hardening)

## Objective

Audit, complete and harden Role Based Access Control (RBAC) for Membership Core
V1.

## Implementation Report

### Files Created

- `apps/web/tests/rbac/rbac-hardening.test.ts`
- `docs/rbac-audit-report.md`
- `tasks/review/003-user-roles-permissions-rbac-hardening.md`

### Files Modified

- `apps/web/features/rbac/permissions.ts`
- `apps/web/features/patients/actions/delete-patient-permanently.ts`
- `apps/web/features/membership-plans/actions/delete-membership-plan-permanently.ts`
- `apps/web/features/membership-benefits/actions/delete-membership-benefit-permanently.ts`
- `apps/web/features/patients/components/patients-page.tsx`
- `apps/web/features/patients/components/patients-table.tsx`
- `apps/web/features/patients/components/patient-row-actions.tsx`
- `apps/web/features/membership-plans/components/membership-plans-page.tsx`
- `apps/web/features/membership-plans/components/membership-plans-table.tsx`
- `apps/web/features/membership-plans/components/membership-plan-row-actions.tsx`
- `apps/web/features/membership-benefits/components/membership-benefits-page.tsx`
- `apps/web/features/membership-benefits/components/membership-benefits-table.tsx`
- `apps/web/features/membership-benefits/components/membership-benefit-row-actions.tsx`
- `apps/web/package.json`
- `package.json`

### Decisions Made

- Extended the existing `hasPermission()/assertPermission()` model instead of
  introducing a second RBAC architecture
- Added explicit `deletePermanent` enforcement to cover destructive actions that
  were too broad under generic `manage`
- Made `ADMIN` billing access configurable through the current permission layer
  and added test overrides for deterministic regression coverage
- Used real server actions in the RBAC regression suite so permission checks are
  validated end-to-end

### What Was Intentionally Left Out

- No new role model or schema change was introduced
- No new granular contract or clinic-settings sub-permission system was added,
  because those V1 operations are still limited in scope
- No browser-driven E2E framework was introduced

### Risks

- Contract operations are still governed by coarse `contracts` permissions until
  more contract mutation surfaces exist
- The admin billing toggle currently depends on environment configuration or a
  test override, so deployment environments should set that expectation
  explicitly
- Future destructive actions must remember to use `deletePermanent` where
  appropriate

### Validation

- `pnpm test:tenant`
- `pnpm test:rbac`
- `pnpm lint`
- `pnpm --dir apps/web typecheck`

### Suggested Next Task

- Add a lightweight users/roles management surface that consumes the hardened
  owner-only permission rules
