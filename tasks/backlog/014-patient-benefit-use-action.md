# Task 014 - Patient Benefit Use Action

## Objective

Add a direct benefit usage action to the patient row actions.

## Requirements

In the patients table action column, add:

- Use Benefit

Visibility rules:

- only visible if patient is ACTIVE
- hidden/disabled if patient is suspended/inactive
- respects RBAC
- respects tenant isolation

Behavior:

- opens dialog to select active subscription
- shows available benefits from the subscribed plan
- validates usage limit
- confirms usage
- persists BenefitUsage
- updates patient history

## Rules

- cannot consume benefit for inactive patient
- cannot consume benefit without active subscription
- cannot consume inactive benefit
- cannot exceed monthly limit
- audit log must record usage

## Tests

Update:

- pnpm test:membership
- pnpm test:rbac
- pnpm test:audit

Test:

- active patient sees benefit usage action
- inactive patient cannot consume benefit
- usage creates history
- usage creates audit log
- STAFF follows existing permission matrix

## Validation

Run:

pnpm test:tenant
pnpm test:rbac
pnpm test:membership
pnpm test:audit
pnpm lint
pnpm --dir apps/web typecheck

## Report

Create:

tasks/review/014-patient-benefit-use-action.md

Move task to review.
Do not start next task.