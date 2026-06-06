# Task 007 - Module Management

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

006-saas-billing-nortex-clinic


## Objective

Implement commercial module management so Nortex can sell modules separately.

V1 active module:
- Membership

Future modules should be represented but not activated in V1:
- CRM
- Scheduling
- Communication
- Patient Portal
- Analytics

## Requirements

Create or validate:
- Module
- ClinicModule

Implement:
- enable module for clinic
- disable module for clinic
- check module access
- hide disabled module navigation
- protect disabled module routes

## Acceptance Criteria

- Clinic can have Membership module enabled.
- Future modules can exist as disabled.
- Disabled modules are not visible in V1 navigation.
- Feature access can be checked programmatically.


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

- `apps/web/features/modules/services/module-access.ts`
- `apps/web/features/modules/actions/enable-clinic-module.ts`
- `apps/web/features/modules/actions/disable-clinic-module.ts`
- `apps/web/features/modules/components/modules-page.tsx`
- `apps/web/app/(dashboard)/dashboard/modules/page.tsx`

### Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/features/rbac/permissions.ts`
- `apps/web/app/(dashboard)/layout.tsx`
- `apps/web/components/layout/dashboard-sidebar.tsx`
- `apps/web/features/clinic/actions/create-clinic.ts`

### Decisions Made

- Represented future commercial modules in data without reviving their product
  surfaces in V1
- Kept Membership permanently enabled as the core module required by the current
  application scope
- Added route-time module enforcement in the dashboard layout for the
  membership module

### What Was Intentionally Left Out

- No CRM, scheduling, communication, portal or analytics routes were activated
- No per-module pricing matrix or contract automation was introduced

### Risks

- Future modules now exist in data and navigation permissions, so later work
  must keep route activation explicit
- Membership module enforcement currently happens at runtime, not through a
  deeper provisioning workflow

### Validation

- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm --dir apps/web build` ✅
- Automated tests not run because the project does not define a test script

### Suggested Next Task

- `tasks/backlog/008-contracts-foundation.md`
