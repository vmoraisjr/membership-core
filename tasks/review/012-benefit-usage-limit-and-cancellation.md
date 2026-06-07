# Task 012 - Benefit Usage Limit and Cancellation

## Objective

Harden V1 benefit usage rules with explicit monthly-limit behavior and
cancelable historical usage records.

## Files Created

- `apps/web/features/benefit-usage/actions/cancel-benefit-usage.ts`
- `apps/web/prisma/migrations/20260607093000_benefit_usage_cancellation/migration.sql`
- `tasks/review/012-benefit-usage-limit-and-cancellation.md`

## Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/features/benefit-usage/services/validate-benefit-usage.ts`
- `apps/web/features/benefit-usage/services/get-patient-benefit-balance.ts`
- `apps/web/features/benefit-usage/services/get-benefit-usage-history.ts`
- `apps/web/features/benefit-usage/components/benefit-usage-table.tsx`
- `apps/web/features/benefit-usage/components/benefit-usage-history-page.tsx`
- `apps/web/features/membership-benefits/schemas/membership-benefit.schema.ts`
- `apps/web/features/membership-benefits/actions/create-membership-benefit.ts`
- `apps/web/features/membership-benefits/actions/update-membership-benefit.ts`
- `apps/web/features/membership-benefits/components/membership-benefit-dialog.tsx`
- `apps/web/features/membership-benefits/components/membership-benefits-table.tsx`
- `apps/web/tests/membership/membership-regression.test.ts`
- `apps/web/tests/audit/audit-log-hardening.test.ts`
- `apps/web/tests/rbac/rbac-hardening.test.ts`
- `apps/web/tests/tenant-isolation/cross-tenant-regression.test.ts`

## What Was Implemented

- Added operational benefit usage cancellation with persistent history.
- Added `BenefitUsage.status` with:
  - `ACTIVE`
  - `CANCELED`
- Added `BenefitUsage.canceledAt` to preserve cancellation history.
- Excluded canceled usages from monthly limit validation and patient benefit
  balances.
- Added owner/admin-only cancellation enforcement while keeping staff blocked.
- Added audit log coverage for benefit usage cancellation.
- Updated the benefit-management UI to express V1 behavior as:
  - unlimited monthly usage
  - limited monthly usage
- Standardized limited benefits to monthly reset behavior in V1.
- Exposed cancellation state in benefit usage history.

## Decisions Made

- Reused the existing `usageLimit` field as the persisted monthly limit instead
  of introducing a second database column during this pass.
- Kept `BenefitType.LIMITED` as the operational type for tracked monthly usage,
  with `usageLimit = null` representing unlimited monthly usage.
- Used the existing audit system with `DEACTIVATE` on `BENEFIT_USAGE` instead of
  inventing a second cancellation event model.

## What Was Intentionally Left Out

- No yearly or custom reset-period expansion for V1.
- No soft-delete or restore flow for canceled usage.
- No separate approval workflow beyond current owner/admin authorization.

## Risks

- Benefit usage history is now richer, so future reporting surfaces should
  distinguish active versus canceled usage explicitly.
- The UI labels now describe monthly-limit behavior more clearly, but the
  underlying persisted field name remains `usageLimit`.

## Validation

- `pnpm --dir apps/web exec prisma migrate deploy` ✅
- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm test:tenant` ✅
- `pnpm test:rbac` ✅
- `pnpm test:membership` ✅
- `pnpm test:audit` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
