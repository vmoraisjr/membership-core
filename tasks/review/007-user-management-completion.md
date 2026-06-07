# Task 007 - User Management Completion

## Objective

Complete operational user management for V1 using the existing invite, RBAC,
tenant isolation, and owner-protection foundation.

## Files Created

- `apps/web/features/users/actions/update-clinic-user-status.ts`
- `apps/web/features/users/actions/remove-clinic-user.ts`
- `apps/web/features/users/actions/revoke-user-invite.ts`
- `apps/web/features/users/services/manage-clinic-user.ts`
- `apps/web/features/users/schemas/user-management.schema.ts`
- `apps/web/tests/users/user-management-completion.test.ts`
- `apps/web/prisma/migrations/20260606230000_user_management_completion/migration.sql`
- `tasks/review/007-user-management-completion.md`

## Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/package.json`
- `package.json`
- `apps/web/features/auth/services/get-current-app-user.ts`
- `apps/web/features/auth/services/authenticate-app-user.ts`
- `apps/web/features/auth/services/create-user-invite.ts`
- `apps/web/features/auth/services/accept-user-invite.ts`
- `apps/web/features/users/actions/update-clinic-user-role.ts`
- `apps/web/features/users/services/get-clinic-users-overview.ts`
- `apps/web/features/users/components/users-page.tsx`

## What Was Implemented

- Added operational user status support:
  - `ACTIVE`
  - `INACTIVE`
  - `PENDING`
- Added invite lifecycle support:
  - pending invite
  - accepted invite
  - revoked invite
  - expired invite
- Added lifecycle actions for clinic operators:
  - invite user
  - deactivate user
  - reactivate user
  - remove user
  - revoke pending invite
- Updated invite creation so pending users are represented explicitly in
  `AppUser` instead of existing only as invite records.
- Updated invite acceptance so a pending user becomes active when onboarding is
  completed.
- Blocked inactive users from authenticating.
- Extended the users UI so operators can see and manage:
  - user status
  - invite status
  - deactivate/reactivate actions
  - removal actions
  - invite revocation

## Owner Protection Completed

- Cannot remove the last active `OWNER`.
- Cannot demote the last active `OWNER`.
- Cannot deactivate the last active `OWNER`.

## Decisions Made

- Reused the existing invite flow instead of adding a separate user-creation
  surface.
- Treated invited-but-not-onboarded users as `PENDING` application users so the
  roster can reflect the full operational state.
- Limited manual reactivation into `ACTIVE` when the target user is `PENDING`
  without a password; those users must still accept their invite properly.
- Kept revocation on the invite record via `revokedAt` instead of deleting
  invite history.

## What Was Intentionally Left Out

- No bulk user import.
- No self-service account deactivation.
- No platform-wide user directory or cross-clinic user reassignment workflow.

## Risks

- Pending users are materialized immediately on invite creation; future work
  must preserve the distinction between `PENDING` and fully onboarded `ACTIVE`
  users.
- The migration for user lifecycle fields needed recovery in this session
  because the initial SQL omitted enum creation before column usage; the final
  schema state is correct, but the migration history includes that recovery
  context.

## Validation

- direct schema recovery SQL for `AppUserStatus`, `AppUser.status`, and
  `UserInvite.revokedAt` ✅
- `pnpm prisma generate` in `apps/web` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm test:users` ✅
- `pnpm test:rbac` ✅
- `pnpm lint` ✅
