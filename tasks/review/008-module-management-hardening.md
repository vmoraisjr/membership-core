# Task 008 - Module Management Hardening

## Objective

Audit and harden Module Management for V1 so only Membership remains commercially active.

## Files Created

- `apps/web/features/modules/services/module-policy.ts`
- `apps/web/tests/modules/module-management-hardening.test.ts`
- `tasks/review/008-module-management-hardening.md`

## Files Modified

- `apps/web/features/modules/actions/enable-clinic-module.ts`
- `apps/web/features/modules/actions/disable-clinic-module.ts`
- `apps/web/features/modules/components/modules-page.tsx`
- `apps/web/features/modules/services/module-access.ts`
- `apps/web/package.json`
- `package.json`

## What Was Implemented

- Added a central V1 module policy that marks only `MEMBERSHIP` as active scope.
- Hardened runtime module resolution so future modules remain effectively disabled in V1.
- Blocked owners from enabling CRM, Scheduling, Communication, Patient Portal or Analytics.
- Kept Membership permanently enabled and non-disableable in V1.
- Updated module UI messaging so future modules are clearly shown as dormant/V2-only.
- Added `pnpm test:modules` regression coverage for:
  - default V1 module state
  - blocked future-module enablement
  - membership protection
  - RBAC denial for staff
  - tenant-safe isolation

## Decisions Made

- Treated future modules as sellable-in-data but not activatable-in-V1.
- Kept the current route enforcement model intact and hardened the mutation/policy layer instead of expanding dormant product routes.

## Intentionally Left Out

- No CRM, Scheduling, Communication, Patient Portal or Analytics activation.
- No module pricing matrix.
- No contract automation for module upsell.

## Risks

- Future V2 work must explicitly relax the V1 policy layer before new modules can become commercially active.
- Seed and bootstrap data can still contain future-module records by design, but runtime policy now keeps them dormant.

## Validation

- `pnpm test:modules` ✅
- `pnpm test:rbac` ✅
