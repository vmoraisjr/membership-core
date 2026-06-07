# Task 016 - Patient Payment Control

## Objective

Create the V1 payment control section for membership subscriptions.

This is about payments from patient to clinic.

Not Nortex SaaS billing.

No gateway integration in V1.

## Requirements

Create or complete payment section showing:

- patient
- subscription
- plan
- invoice amount
- due date
- status
- payment date
- payment method

Payment methods:

- CARD
- PIX
- CASH

Optional if already modeled:

- BANK_TRANSFER
- OTHER

Payment statuses:

- PENDING
- PAID
- OVERDUE
- CANCELED
- FAILED

Actions:

- mark as paid
- mark as overdue
- cancel invoice if supported
- update payment method
- view payment history

Rules:

- STAFF cannot confirm payment unless RBAC allows
- ADMIN/OWNER can confirm payment
- payments are tenant-scoped
- payment confirmation creates audit log
- overdue status creates audit log

## UI

Create or complete:

/dashboard/payments

or use existing billing page if already present.

The section should focus on clinic operational payments, not Nortex billing.

## Tests

Create or update:

pnpm test:billing
pnpm test:audit
pnpm test:rbac
pnpm test:tenant

Test:

- invoice appears for subscription
- payment can be marked paid
- payment method is stored
- staff cannot confirm payment
- owner/admin can confirm payment
- Alpha cannot access Beta payment
- audit log is created

## Validation

Run:

pnpm test:tenant
pnpm test:rbac
pnpm test:membership
pnpm test:billing
pnpm test:audit
pnpm lint
pnpm --dir apps/web typecheck

## Report

Create:

tasks/review/016-patient-payment-control.md

Move task to review.
Do not start next task.