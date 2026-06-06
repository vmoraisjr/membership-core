# Task 001 - Authentication Foundation

## Context Verification

If the current session already contains the project context, architecture,
roadmap and workflow instructions, do not reload the documentation.

Proceed directly to repository audit and task execution.

Only reload these documents when:
- Starting a new session
- Context has been lost
- A document was modified since the last review
- The task explicitly requires architectural review

Documents:
- docs/ai-context.md
- docs/architecture.md
- docs/roadmap.md
- docs/codex-workflow.md


## Dependencies

000-scope-reset-v1


## Objective

Implement or finalize real authentication for Membership Core V1.

Recommended stack:
- Better Auth
- Prisma
- PostgreSQL

If another auth foundation already exists, audit first and extend instead of replacing blindly.

## Requirements

Implement or validate:
- Login
- Logout
- Session
- Current user
- Password reset or recovery foundation
- Invite user foundation if feasible
- Auth middleware / route protection
- Protected dashboard routes

## Expected Files / Areas

Possible areas:
- features/auth
- lib/auth
- app/(auth)
- middleware.ts
- prisma schema updates if required

## Acceptance Criteria

- Unauthenticated users cannot access dashboard.
- Authenticated users can access dashboard.
- Current user can be resolved server-side.
- Authentication does not break existing CRUD modules.


## Repository Audit

Before implementing:
1. Inspect repository state.
2. Identify existing implementations.
3. Reuse existing code.
4. Avoid duplicate components.
5. Avoid duplicate services.
6. Preserve feature-first architecture.
7. Do not revive out-of-scope modules for V1.

## V1 Scope Guardrails

In scope:
- Authentication
- Tenant / Clinic isolation
- Users and roles
- Patients
- Membership Plans
- Membership Benefits
- Subscriptions
- Benefit Usage
- Patient billing
- Nortex SaaS billing
- Contracts
- Basic dashboard
- Production readiness

Out of scope:
- CRM
- Scheduling
- Calendar
- Communication Hub
- WhatsApp
- Instagram
- Email automation
- Lead pipeline

## Completion Workflow

1. Run lint.
2. Run typecheck.
3. Run tests if available.
4. Generate implementation report.
5. Move task to tasks/review.
6. Never move task directly to done.
7. Do not start the next task automatically.

## Implementation Report Required

Create or update a report containing:
- Files created
- Files modified
- Decisions made
- What was intentionally left out
- Risks
- Suggested next task

## Implementation Report

### Files Created

- `apps/web/lib/auth/password.ts`
- `apps/web/lib/auth/session.ts`
- `apps/web/features/auth/services/authenticate-app-user.ts`
- `apps/web/features/auth/services/create-auth-session.ts`
- `apps/web/features/auth/services/delete-auth-session.ts`
- `apps/web/features/auth/services/create-password-reset-token.ts`
- `apps/web/features/auth/services/reset-password-with-token.ts`
- `apps/web/features/auth/services/create-user-invite.ts`
- `apps/web/features/auth/services/accept-user-invite.ts`
- `apps/web/features/auth/actions/login.ts`
- `apps/web/features/auth/actions/logout.ts`
- `apps/web/features/auth/actions/request-password-reset.ts`
- `apps/web/features/auth/actions/reset-password.ts`
- `apps/web/features/auth/actions/create-user-invite.ts`
- `apps/web/features/auth/actions/accept-user-invite.ts`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/forgot-password/page.tsx`
- `apps/web/app/(auth)/reset-password/page.tsx`
- `apps/web/app/(auth)/invite/page.tsx`
- `apps/web/middleware.ts`
- `apps/web/prisma/migrations/20260606143000_auth_foundation/migration.sql`

### Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/features/auth/services/get-current-app-user.ts`
- `apps/web/features/auth/services/get-current-user-role.ts`
- `apps/web/features/audit-log/services/create-audit-log.ts`
- `apps/web/lib/auth/get-current-clinic.ts`
- `apps/web/app/(dashboard)/layout.tsx`
- `apps/web/components/layout/dashboard-header.tsx`
- `apps/web/app/page.tsx`
- `tasks/review/001-authentication-foundation.md`

### Decisions Made

- Replaced the cookie-based mock user switcher flow with a real server-side
  session model backed by Prisma
- Added `AuthSession`, `PasswordResetToken` and `UserInvite` models instead of
  introducing a new external auth dependency mid-stream
- Kept authentication role typing compatible with the existing RBAC layer
- Protected dashboard access in two layers: middleware for fast redirects and
  dashboard layout checks for real session validation
- Preserved local developer bootstrap users, but gated automatic bootstrap so it
  does not silently create default credentials in production unless explicitly
  allowed

### What Was Intentionally Left Out

- No email delivery integration was added for password reset or invites
- No dedicated invite management UI was added to dashboard pages
- No migration execution against a live database was performed in this task
- No replacement/removal of dormant mock auth files was done unless required for
  build stability
- No Better Auth package adoption was attempted because the repository already
  had a custom auth foundation and network/package changes were unnecessary for
  acceptance

### Risks

- Password reset and invite tokens are generated and stored, but a delivery
  channel still needs to be implemented before those flows are fully usable by
  end users
- Existing production databases will need the new Prisma migration applied
  before runtime auth can work correctly
- Legacy mock auth files remain in the repo and should not be reused by future
  tasks

### Validation

- `pnpm exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm exec tsc --noEmit` ✅
- Automated tests not run because `apps/web/package.json` does not define a test
  script

### Suggested Next Task

- `tasks/backlog/002-tenant-isolation.md`
