# Task 005 - Membership Regression Suite

## Objective

Add an automated regression suite for the core Membership Engine and expose it through `pnpm test:membership`.

## Files Created

- `apps/web/tests/membership/membership-regression.test.ts`
- `tasks/review/005-membership-regression-suite.md`

## Files Modified

- `package.json`
- `apps/web/package.json`
- `apps/web/features/patients/actions/create-patient.ts`
- `apps/web/features/membership-plans/actions/create-membership-plan.ts`
- `apps/web/features/membership-plans/actions/deactivate-membership-plan.ts`
- `apps/web/features/membership-plans/actions/reactivate-membership-plan.ts`
- `apps/web/features/membership-benefits/actions/create-membership-benefit.ts`
- `apps/web/features/membership-benefits/actions/deactivate-membership-benefit.ts`
- `apps/web/features/membership-benefits/actions/reactivate-membership-benefit.ts`
- `apps/web/features/subscriptions/actions/create-subscription.ts`
- `apps/web/features/subscriptions/actions/pause-subscription.ts`
- `apps/web/features/subscriptions/actions/resume-subscription.ts`
- `apps/web/features/subscriptions/actions/expire-subscription.ts`
- `apps/web/features/subscriptions/actions/renew-subscription.ts`
- `apps/web/features/subscriptions/actions/cancel-subscription.ts`
- `apps/web/features/benefit-usage/actions/consume-benefit.ts`

## What Was Implemented

- Added `pnpm test:membership` at root and app level.
- Added a script-based regression suite using the same `tsx` pattern already used by `test:tenant` and `test:rbac`.
- Covered:
  - patient creation
  - membership plan creation
  - membership benefit creation
  - subscription creation
  - subscription side effects into billing and contracts
  - benefit consumption guardrails
  - pause, resume, expire, renew and cancel flows
  - plan deactivation cascade into benefits and subscriptions
  - plan and benefit reactivation for future enrollments
- Switched the tested membership actions to `safeRevalidatePath()` so they can run under regression scripts without failing on missing static generation store state.

## Decisions Made

- Reused the existing `tsx` regression pattern instead of introducing a separate test runner.
- Exercised real server actions rather than lower-level helpers so the suite validates permission checks, transactions and side effects together.
- Kept the fixture isolated under its own clinic slug to avoid touching development data.

## Intentionally Left Out

- No new product features.
- No UI interaction tests.
- No CRM, billing-only or contract-only regression expansion outside membership-linked side effects.

## Risks

- The suite relies on database-backed integration behavior, so it is slower and more environment-sensitive than pure unit tests.
- Some neighboring membership actions still use direct `revalidatePath()` and may need the same safe wrapper if future tests start exercising them.

## Validation

- `pnpm test:membership` ✅
- `pnpm test:tenant` ✅
- `pnpm test:rbac` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm lint` ✅
