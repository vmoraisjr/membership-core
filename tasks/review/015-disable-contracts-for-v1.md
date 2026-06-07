# Task 015 - Disable Contracts For V1

## Objective

Remove Contracts from the active V1 operator experience without deleting the
existing contract foundation.

## Files Created

- `tasks/review/015-disable-contracts-for-v1.md`

## Files Modified

- `apps/web/components/layout/dashboard-sidebar.tsx`
- `docs/v1-scope.md`
- `docs/known-limitations.md`
- `docs/roadmap.md`
- `docs/deployment-checklist.md`
- `docs/manual-qa-checklist.md`

## What Was Implemented

- Removed the Contracts entry from the active dashboard sidebar.
- Kept contract code, routes, tests and database structures intact.
- Repositioned contracts in the documentation as an internal foundation instead
  of an active V1 navigation module.
- Updated deployment and manual QA guidance so operators validate that
  Contracts is not exposed in the pilot navigation.

## Decisions Made

- Preserved contract-side effects used by subscriptions and regression suites.
- Kept the internal route available for support and regression workflows rather
  than deleting the feature surface.

## Risks

- Because the internal route still exists, future UI work should avoid
  reintroducing public navigation or links to Contracts by accident.

## Validation

- `pnpm test:tenant` OK
- `pnpm test:rbac` OK
- `pnpm test:membership` OK
- `pnpm test:contracts` OK
- `pnpm lint` OK
- `pnpm --dir apps/web typecheck` OK
