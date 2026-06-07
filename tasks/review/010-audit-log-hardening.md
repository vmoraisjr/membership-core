# Task 010 - Audit Log Hardening

## Objective

Complete audit log coverage for critical V1 operations using the existing
audit-log foundation.

## Files Created

- `apps/web/tests/audit/audit-log-hardening.test.ts`
- `apps/web/prisma/migrations/20260606203000_audit_log_hardening/migration.sql`
- `tasks/review/010-audit-log-hardening.md`

## Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/package.json`
- `package.json`
- `apps/web/features/audit-log/services/create-audit-log.ts`
- `apps/web/features/audit-log/services/get-audit-logs.ts`
- `apps/web/features/auth/services/create-auth-session.ts`
- `apps/web/features/auth/services/create-user-invite.ts`
- `apps/web/features/auth/actions/create-user-invite.ts`
- `apps/web/features/users/actions/update-clinic-user-role.ts`
- `apps/web/features/billing/services/billing-foundation.ts`
- `apps/web/features/subscriptions/actions/create-subscription.ts`
- `apps/web/features/subscriptions/actions/renew-subscription.ts`
- `apps/web/features/contracts/actions/save-contract-template.ts`

## What Was Implemented

- Added missing audit coverage for:
  - user invited
  - role changed
  - login/session creation
  - invoice created for patient billing
  - invoice created for clinic SaaS billing
  - contract template create versus update
- Kept the existing `createAuditLog()` helper and hardened it so it works both
  inside request scope and in system/background-style flows without cookies.
- Added new audit enum support for:
  - `LOGIN`
  - `APP_USER`
  - `USER_INVITE`
- Added `pnpm test:audit` regression coverage for the newly hardened gaps.

## Existing Critical Coverage Verified

- Membership audit coverage was already present for:
  - patient create/update/suspend/delete
  - plan create/update/deactivate/delete
  - benefit create/update/deactivate/delete
  - subscription create/update/cancel/reactivate/renew/pause/expire
  - benefit consumed
- Billing audit coverage was already present for:
  - invoice marked paid
  - invoice marked overdue
- Contracts audit coverage was already present for:
  - patient contract accepted
  - clinic contract changed
- Modules audit coverage was already present for:
  - module enabled
  - module disabled

## Decisions Made

- Reused the existing audit log model and helper instead of introducing a new
  audit subsystem.
- Logged session creation as the canonical login event because that is the
  shared authentication point used by both direct login and invite acceptance.
- Logged invoice creation in the shared billing foundation so both manual
  membership flows and automatic SaaS billing bootstrap are covered.
- Distinguished contract template create versus update at the action layer
  before the existing upsert path runs.

## What Was Intentionally Left Out

- No second audit table or event bus.
- No analytics or reporting layer over audit logs.
- No attempt to audit failed login attempts in this task.

## Risks

- The Prisma schema now includes new audit enum values, but the current code is
  intentionally resilient to a temporarily stale generated client on Windows.
  A future clean `prisma generate` is still recommended when the local engine
  lock is gone.
- System-generated audit entries currently use `actor: "System"` for automated
  billing foundation events; if V1 later needs richer provenance, that should
  be standardized separately.

## Validation

- `pnpm test:audit` ✅
- `pnpm test:rbac` ✅
- `pnpm test:membership` ✅
- `pnpm test:contracts` ✅
- `pnpm test:billing` ✅
- `pnpm --dir apps/web exec prisma migrate deploy` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm lint` ✅
