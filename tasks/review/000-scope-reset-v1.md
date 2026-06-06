# Task 000 - Scope Reset for V1 Production

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

None


## Objective

Reset the active roadmap to a lean V1 production scope.

The project previously explored CRM, scheduling, calendar and communication modules.
These modules must be excluded from V1 execution without necessarily deleting existing work.

## Requirements

1. Audit the repository for:
   - CRM routes
   - Scheduling routes
   - Calendar routes
   - Communication routes
   - Navigation links
   - Dashboard cards
   - Active imports
   - Build-blocking dependencies

2. Remove from active navigation:
   - CRM
   - Leads
   - Pipeline
   - Scheduling
   - Calendar
   - Communication
   - Inbox
   - WhatsApp/Instagram/Email automation

3. Keep future modules safely dormant:
   - Do not delete useful code unless it breaks build.
   - If needed, move references to docs/future-modules.md.
   - Make sure dormant code does not affect production build.

4. Update documentation:
   - docs/roadmap.md
   - docs/current-state.md if present
   - docs/ai-context.md if necessary

## Acceptance Criteria

- V1 scope is clearly documented.
- App navigation only exposes V1 modules.
- Out-of-scope modules do not block build.
- Codex future tasks are aligned with lean V1.


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

- `docs/roadmap.md`
- `docs/future-modules.md`
- `docs/ai-context.md`

### Files Modified

- `apps/web/components/layout/dashboard-sidebar.tsx`
- `apps/web/app/(dashboard)/dashboard/crm/page.tsx`
- `docs/v1-scope.md`
- `docs/ai-contex.md`
- `tasks/review/000-scope-reset-v1.md`

### Repository Audit Summary

- Active out-of-scope route found: `/dashboard/crm`
- Active out-of-scope navigation found: CRM sidebar link
- No active scheduling, calendar, communication, inbox, WhatsApp, Instagram or
  email automation routes were found in `apps/web`
- No out-of-scope dashboard cards were found; the current dashboard remains
  focused on patients, plans, subscriptions, revenue and benefit usage
- Dormant CRM code remains under `apps/web/features/crm`
- CRM Prisma models and migrations remain in place and did not block lint or
  typecheck

### Decisions Made

- Removed CRM from active dashboard navigation
- Kept CRM source code in the repository for future scope
- Made `/dashboard/crm` return `notFound()` so the module stays dormant in V1
- Added a canonical `docs/roadmap.md` for the lean V1 scope
- Added `docs/future-modules.md` to track preserved but inactive modules
- Added `docs/ai-context.md` and converted `docs/ai-contex.md` into a
  compatibility pointer

### Intentionally Left Out

- No CRM feature files, Prisma models or migrations were deleted
- No permission model refactor was performed for the dormant `crm` resource
- No future modules were reactivated
- No `docs/current-state.md` update was made because the file does not exist
- No automated tests were run because no test script is configured in
  `apps/web/package.json`

### Validation

- `pnpm lint` ✅
- `pnpm exec tsc --noEmit` ✅

### Risks

- The dormant `crm` resource still exists in RBAC permissions and Prisma schema,
  so future work should keep roadmap/docs aligned before re-exposing it
- Direct manual access to future CRM internals is blocked at the route level,
  but the codebase still carries the maintenance cost of dormant feature code

### Suggested Next Task

- `tasks/backlog/001-authentication-foundation.md`
