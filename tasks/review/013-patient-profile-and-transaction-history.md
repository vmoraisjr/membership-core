# Task 013 - Patient Profile and Transaction History

## Objective

Create a patient detail page with full operational history.

## Requirements

### Patient name link

In the patients table, make the patient name clickable.

Route example:

/dashboard/patients/[patientId]

### Patient detail page

Create a page showing:

- patient data
- registration date
- current status
- subscriptions
- benefit usage history
- canceled benefit usages
- payment history
- patient contract history if contracts remain available internally
- audit log entries related to this patient

### Transaction timeline

Create a chronological history containing:

- patient created
- patient updated
- plan subscribed
- subscription canceled/reactivated/expired
- benefit consumed
- benefit usage canceled
- invoice created
- payment confirmed
- payment overdue
- relevant audit log entries

## Rules

- tenant-safe
- RBAC-safe
- patient must belong to current clinic
- STAFF can view if current RBAC allows patient view
- no cross-tenant data leakage

## Tests

Update or add:

- pnpm test:tenant
- pnpm test:membership
- pnpm test:users if needed

Test:

- Alpha cannot access Beta patient detail
- patient timeline only shows patient-related data
- inactive/canceled records appear historically

## Validation

Run:

pnpm test:tenant
pnpm test:rbac
pnpm test:membership
pnpm lint
pnpm --dir apps/web typecheck

## Report

Create:

tasks/review/013-patient-profile-and-transaction-history.md

Move task to review.
Do not start next task.