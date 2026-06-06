# Task 002 - Clinic Tenant Isolation

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

001-authentication-foundation


## Objective

Ensure each clinic only sees and manages its own data.

## Requirements

Create or finalize:
- getCurrentClinic()
- assertClinicAccess()
- tenant-aware service helpers
- clinicId filters in all V1 services/actions

Audit tenant safety for:
- Patients
- Membership Plans
- Membership Benefits
- Subscriptions
- Benefit Usage
- Patient Billing
- Contracts
- Dashboard metrics

## Acceptance Criteria

- No clinic can access another clinic's data.
- All V1 queries are clinic-scoped.
- Server actions validate tenant context.
- Dashboard metrics are tenant-scoped.


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

- `apps/web/lib/auth/assert-clinic-access.ts`

### Files Modified

- `apps/web/lib/auth/get-current-clinic.ts`
- `apps/web/features/clinic/services/get-clinics.ts`
- `apps/web/features/clinic/components/clinic-page.tsx`
- `apps/web/features/clinic/actions/create-clinic.ts`
- `apps/web/features/clinic/actions/update-clinic.ts`
- `apps/web/features/clinic/actions/deactivate-clinic.ts`
- `apps/web/features/clinic/actions/reactivate-clinic.ts`
- `apps/web/features/patients/actions/update-patient.ts`
- `apps/web/features/membership-plans/actions/update-membership-plan.ts`
- `tasks/review/002-tenant-isolation.md`

### Decisions Made

- Removed the implicit `findFirst()` fallback from `getCurrentClinic()` so
  tenant resolution now depends on the authenticated user's `clinicId`
- Added `assertClinicAccess()` to enforce explicit clinic ownership checks where
  raw clinic ids are handled directly
- Restricted the clinic listing page to the current tenant only
- Allowed the clinic page to return an empty list when an authenticated user has
  no assigned clinic, preserving a path for first-clinic bootstrap
- Added explicit tenant existence checks before patient and membership plan
  updates that previously trusted raw record ids
- Prevented authenticated tenant users from creating additional clinics once a
  clinic is already assigned

### What Was Intentionally Left Out

- No changes were made to dormant CRM code beyond repository audit awareness
- No patient billing or contracts module changes were made because those modules
  are not yet implemented in the app surface
- No database schema changes were needed for this task
- No new automated tests were added because the project still lacks a test
  harness/script

### Risks

- Users authenticated without a `clinicId` can only safely operate in the clinic
  bootstrap path until a clinic is assigned
- Some service safety still relies on existing scoped pre-queries before
  `update/delete`, so future V1 mutations should keep following the same pattern
- Clinic creation is intentionally limited in V1; if a platform-admin workflow is
  introduced later, it will need a separate non-tenant administration boundary

### Validation

- `pnpm lint` ✅
- `pnpm exec tsc --noEmit` ✅
- Automated tests not run because `apps/web/package.json` does not define a test
  script

### Suggested Next Task

- `tasks/backlog/003-user-roles-permissions.md`
