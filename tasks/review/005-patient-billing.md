# Task 005 - Patient Billing

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

004-membership-engine-stabilization


## Objective

Implement billing between clinic and patient for membership subscriptions.

For V1, start with manual/payment-status billing.
Gateway integration can be future work.

## Requirements

Create or validate entities:
- PatientInvoice
- PatientPayment
- PaymentStatus
- BillingCycle

Minimum statuses:
- PENDING
- PAID
- OVERDUE
- CANCELED
- FAILED

Implement:
- create invoice from subscription
- mark invoice as paid
- mark invoice as overdue
- list invoices by patient/subscription
- basic billing dashboard section

## Acceptance Criteria

- A subscription can generate patient billing records.
- Clinic can see payment status.
- Manual payment confirmation works.
- Billing is tenant-scoped and permission-protected.


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

- `apps/web/features/billing/services/billing-foundation.ts`
- `apps/web/features/billing/actions/mark-patient-invoice-paid.ts`
- `apps/web/features/billing/actions/mark-patient-invoice-overdue.ts`
- `apps/web/features/billing/components/billing-page.tsx`
- `apps/web/app/(dashboard)/dashboard/billing/page.tsx`

### Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/components/layout/dashboard-sidebar.tsx`
- `apps/web/features/rbac/permissions.ts`
- `apps/web/features/subscriptions/actions/create-subscription.ts`
- `apps/web/features/subscriptions/actions/renew-subscription.ts`

### Decisions Made

- Introduced manual V1 patient invoice and payment records instead of online
  gateway automation
- Coupled subscription enrollment and renewal to invoice creation so billing is
  never skipped in the happy path
- Kept billing actions tenant-scoped and permission-guarded to align with the
  RBAC foundation

### What Was Intentionally Left Out

- No recurring payment processor integration
- No automated dunning, reminders or refunds workflow

### Risks

- Manual payment confirmation can drift from real-world bank settlement if
  operators do not update invoice status promptly
- Historical patient invoices are not yet exposed with advanced filtering or
  export flows

### Validation

- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm --dir apps/web build` ✅
- Automated tests not run because the project does not define a test script

### Suggested Next Task

- `tasks/backlog/006-saas-billing-nortex-clinic.md`
