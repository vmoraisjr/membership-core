# Task 009 - Basic Dashboard Hardening

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

Harden the V1 dashboard so it uses real production-relevant metrics.

## Metrics

Clinic dashboard:
- active patients
- active subscriptions
- active plans
- overdue patient invoices
- monthly patient revenue
- benefits consumed

Nortex/platform admin dashboard:
- active clinics
- trial clinics
- past due clinics
- monthly SaaS revenue
- active module counts

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
- `apps/web/tests/tenant-isolation/cross-tenant-regression.test.ts`
- `tasks/review/009-basic-dashboard.md`

### Decisions Made

- Split the dashboard service into two safe scopes:
  clinic operators receive only tenant-scoped V1 membership metrics, while
  workspace operators receive platform SaaS metrics.
- Added active plan counts to the clinic dashboard because plan availability is
  part of the real production operating picture for V1.
- Kept platform metrics limited to billing, clinic health and active module
  counts instead of introducing out-of-scope CRM or scheduling analytics.

### What Was Intentionally Left Out

- No cross-module analytics, forecasting or charts.
- No CRM, scheduling or communication metrics were introduced.

### Risks

- Dashboard revenue still reflects recognized paid invoices only, so manual
  billing discipline affects visibility.
- Active module counts are operational counts of enabled clinic assignments,
  not commercial ARR analytics.

### Validation

- `pnpm test:tenant` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm lint` ✅

### Suggested Next Task

- `tasks/backlog/010-production-readiness.md`
