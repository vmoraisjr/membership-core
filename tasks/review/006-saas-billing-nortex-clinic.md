# Task 006 - Nortex SaaS Billing

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

005-patient-billing


## Objective

Implement billing between Nortex and clinics.

This is the commercial SaaS billing layer.

## Requirements

Create or validate entities:
- ClinicBillingPlan
- ClinicSubscription
- ClinicInvoice
- ClinicPayment

Statuses:
- TRIAL
- ACTIVE
- PAST_DUE
- SUSPENDED
- CANCELED

Payment statuses:
- PENDING
- PAID
- OVERDUE
- FAILED
- REFUNDED

Implement:
- clinic billing plans
- clinic subscription
- clinic invoices
- manual payment confirmation
- clinic billing status display
- admin-only access

## Acceptance Criteria

- Nortex can track clinic billing.
- Clinic has a platform subscription status.
- Past due/suspended clinics can be identified.
- Billing data is not visible to normal clinic staff unless authorized.


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

- `apps/web/features/billing/actions/mark-clinic-invoice-paid.ts`
- `apps/web/features/billing/actions/mark-clinic-invoice-overdue.ts`

### Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/features/clinic/actions/create-clinic.ts`
- `apps/web/features/billing/services/billing-foundation.ts`
- `apps/web/features/dashboard/services/get-dashboard-metrics.ts`
- `apps/web/features/dashboard/components/dashboard-home-page.tsx`

### Decisions Made

- Modeled Nortex-to-clinic billing as a separate commercial layer using clinic
  plans, subscriptions, invoices and payments
- Auto-provisioned the default clinic SaaS subscription when a clinic is
  created so every tenant starts with a commercial record
- Exposed platform-wide metrics only to workspace-level `OWNER` or `ADMIN`
  users without clinic tenancy

### What Was Intentionally Left Out

- No automated billing renewal scheduler for clinic SaaS invoices
- No suspension of product routes beyond status visibility and admin metrics

### Risks

- Multiple historical clinic subscriptions per tenant are possible because V1
  preserves history instead of enforcing a strict one-row model
- Manual invoice transitions still determine the commercial status lifecycle

### Validation

- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm --dir apps/web build` ✅
- Automated tests not run because the project does not define a test script

### Suggested Next Task

- `tasks/backlog/007-module-management.md`
