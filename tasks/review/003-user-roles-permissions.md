# Task 003 - User Roles and Permissions

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

002-tenant-isolation


## Objective

Implement role-based access control for clinic users.

## Roles

Minimum V1 roles:
- OWNER
- ADMIN
- STAFF

Optional:
- FINANCE
- READ_ONLY

## Requirements

Implement:
- role model or enum
- permission helpers
- assertPermission()
- UI action hiding where appropriate
- server-action permission checks

Permissions should cover:
- Patients
- Plans
- Benefits
- Subscriptions
- Billing
- Contracts
- Dashboard

## Acceptance Criteria

- Staff cannot access billing/admin-only areas.
- Finance/admin can access billing.
- Server actions are protected.
- UI hides unavailable actions.


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

- `apps/web/prisma/migrations/20260606170000_rbac_roles_v1/migration.sql`

### Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/features/auth/constants/roles.ts`
- `apps/web/features/rbac/permissions.ts`
- `apps/web/features/auth/services/get-current-app-user.ts`
- `apps/web/features/auth/actions/create-user-invite.ts`
- `tasks/review/003-user-roles-permissions.md`

### Decisions Made

- Replaced the old `MANAGER` role model with the V1 clinic RBAC roles
  `OWNER`, `ADMIN`, `STAFF`, plus optional `FINANCE` and `READ_ONLY`
- Expanded the permission matrix to include `billing`, `contracts` and `users`
  so upcoming V1 billing/contracts work can plug into the same RBAC foundation
- Set dormant CRM permissions to empty for every role to avoid reviving an
  out-of-scope module through authorization changes
- Added assignable-role rules so only `OWNER` and `ADMIN` can create invites,
  and only `OWNER` can assign the `OWNER` role
- Updated the local auth bootstrap users so every V1 role has a seeded account
  for validation and development

### What Was Intentionally Left Out

- No new dashboard navigation entries were added for billing, contracts or user
  administration because those modules/pages are not active yet
- No dedicated user-management UI was introduced; only the invite foundation was
  hardened server-side
- No dormant CRM UI or routes were re-enabled
- No automated tests were added because the project still lacks a test
  harness/script

### Risks

- Existing databases will need the new enum migration applied before runtime
  role values match the updated application code
- Older local environments may still contain legacy `manager+...` seeded users;
  those records remain harmless but may coexist with new seeded role accounts
- Billing and contracts permissions are now modeled, but the corresponding app
  surfaces still need to adopt `hasPermission()` and `assertPermission()` when
  those modules are implemented

### Validation

- `pnpm exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm exec tsc --noEmit` ✅
- Automated tests not run because `apps/web/package.json` does not define a test
  script

### Suggested Next Task

- `tasks/backlog/004-membership-engine-stabilization.md`
