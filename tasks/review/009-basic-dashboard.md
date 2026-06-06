# Task 009 - Basic Production Dashboard

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

008-contracts-foundation


## Objective

Implement a real V1 dashboard using production-relevant metrics.

## Metrics

Clinic dashboard:
- active patients
- active subscriptions
- overdue patient invoices
- monthly patient revenue
- benefits consumed

Nortex/platform admin dashboard:
- active clinics
- trial clinics
- past due clinics
- monthly SaaS revenue

## Requirements

Use real database data.
No mock values.

## Acceptance Criteria

- Dashboard reflects actual tenant-scoped data.
- Platform metrics are admin-only.
- No CRM/scheduling/communication metrics in V1.


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

- None

### Files Modified

- `apps/web/features/dashboard/services/get-dashboard-metrics.ts`
- `apps/web/features/dashboard/components/dashboard-home-page.tsx`

### Decisions Made

- Refocused the dashboard on real V1 operating metrics: active patients,
  subscriptions, overdue invoices, patient revenue and benefit activity
- Added a platform snapshot that only appears for workspace-level operators so
  tenant and platform perspectives stay separate
- Removed reliance on broader SaaS-style metrics that did not match the current
  V1 scope as clearly

### What Was Intentionally Left Out

- No cross-module analytics, forecasting or charts
- No CRM or scheduling metrics were introduced

### Risks

- Dashboard revenue reflects recognized paid invoices only, so manual billing
  discipline affects visibility
- The dashboard is still operational rather than analytical; deeper BI needs are
  left for later phases

### Validation

- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm --dir apps/web build` ✅
- Automated tests not run because the project does not define a test script

### Suggested Next Task

- `tasks/backlog/010-production-readiness.md`
