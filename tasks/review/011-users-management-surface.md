# Task 011 - Users Management Surface

## Objective

Add an owner-facing users management surface on top of the existing RBAC and invite foundation.

## Files Created

- `apps/web/app/(dashboard)/dashboard/users/page.tsx`
- `apps/web/features/users/actions/submit-user-invite.ts`
- `apps/web/features/users/actions/update-clinic-user-role.ts`
- `apps/web/features/users/components/users-page.tsx`
- `apps/web/features/users/services/get-clinic-users-overview.ts`
- `tasks/review/011-users-management-surface.md`

## Files Modified

- `apps/web/components/layout/dashboard-sidebar.tsx`
- `apps/web/tests/rbac/rbac-hardening.test.ts`
- `apps/web/tests/tenant-isolation/cross-tenant-regression.test.ts`

## What Was Implemented

- Added `/dashboard/users` as an owner-only workspace page.
- Added tenant-scoped roster and invite-history queries based on the current clinic.
- Added invite creation feedback so the generated invite token can be copied from the UI.
- Added role reassignment for clinic users with owner-only enforcement.
- Added safety checks to block self-role changes from this screen and prevent reassignment of the last clinic owner.
- Added regression coverage for:
  - owner role reassignment
  - admin/staff denial on user management
  - cross-tenant role update denial
  - tenant-scoped user and invite listing

## Decisions Made

- Reused the existing `users` permission resource instead of introducing a second authorization path.
- Kept the page server-rendered and used server actions plus redirect feedback instead of a new client-side state architecture.
- Scoped user and invite queries strictly by `clinicId` to preserve tenant isolation.
- Left invite acceptance as the existing `/invite` flow and only surfaced invite creation and tracking inside the dashboard.

## Intentionally Left Out

- No user deactivation flow because the current schema has no active/inactive lifecycle for `AppUser`.
- No password reset management surface for owners.
- No audit entity for user-role changes because the current audit schema does not yet model user-management entities.

## Risks

- Role update feedback depends on redirect-based query params, so messages are lightweight rather than fully interactive.
- Tests were updated but could not be executed in this session because the sandbox failed during process bootstrap for `pnpm test:tenant`, `pnpm test:rbac`, and `pnpm --dir apps/web typecheck`.
- User-management events still do not write audit logs; if that becomes a compliance need, the audit schema should be extended first.

## Validation

- `pnpm lint` ✅
- `pnpm test:tenant` blocked by sandbox bootstrap failure
- `pnpm test:rbac` blocked by sandbox bootstrap failure
- `pnpm --dir apps/web typecheck` blocked by sandbox bootstrap failure
