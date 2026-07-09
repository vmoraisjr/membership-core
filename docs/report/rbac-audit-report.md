# RBAC Audit Report

## Current RBAC Map

Existing RBAC is centered on:

- `apps/web/features/auth/constants/roles.ts`
- `apps/web/features/auth/services/get-current-user-role.ts`
- `apps/web/features/rbac/permissions.ts`
- `apps/web/features/rbac/services/assert-permission.ts`

UI visibility primarily relies on `hasPermission()`.

Server actions primarily rely on `assertPermission()`.

## Existing Protection Coverage

Protected via `assertPermission()`:

- Patients mutations
- Membership plan mutations
- Membership benefit mutations
- Subscription lifecycle mutations
- Benefit usage consumption
- Billing mutations
- Contracts acceptance
- Clinic mutations
- Module enable/disable
- User invite creation

Protected via `hasPermission()`:

- Dashboard navigation
- Patients page
- Plans page
- Benefits page
- Subscriptions page
- Billing page
- Contracts page
- Modules page
- Clinic page
- Audit log page

## Hardening Applied

- Restricted `ADMIN` from users and modules management
- Made `ADMIN` billing access configurable instead of always-on
- Removed `STAFF` access to membership plans
- Added explicit `deletePermanent` permission enforcement for destructive
  patient, plan and benefit operations
- Kept UI visibility aligned with the hardened permission matrix by wiring
  permanent-delete controls to explicit permission checks

## Safe

- Owner-only operations now include user invite creation and module management
- Staff can no longer reach permanent delete paths server-side
- Billing mutations remain server-protected and are blocked for staff
- Admin billing behavior is explicit and testable

## Residual Risks

- The permission model is still coarse-grained for contracts and clinic
  settings, because V1 only implements a subset of those operations
- Future additions to users, roles and clinic-platform settings should keep
  relying on `assertPermission()` rather than UI state
