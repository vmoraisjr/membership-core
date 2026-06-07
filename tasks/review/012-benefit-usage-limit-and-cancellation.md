# Task 012 - Benefit Usage Limit and Cancellation

## Objective

Improve benefit usage rules for V1.

## Requirements

### Benefit usage limit

When creating or editing a membership benefit, allow defining:

- unlimited monthly usage
- limited monthly usage

If limited, store:

- monthlyUsageLimit

Rules:

- unlimited benefits can be consumed without monthly count restriction
- limited benefits must validate monthly usage count before consumption
- limit resets monthly

### Benefit usage cancellation

Add ability to cancel a benefit usage record.

Business rule:

- usage cancellation requires ADMIN or OWNER approval
- STAFF cannot cancel usage
- canceled usage should not count against the monthly limit
- canceled usage must remain in history
- audit log must record cancellation

## Expected changes

Audit current models before editing.

Possible changes:

- BenefitUsage status
- MembershipBenefit monthly limit fields
- cancel-benefit-usage action
- benefit usage tests
- audit log coverage

## Tests

Create or update:

- pnpm test:membership
- pnpm test:audit
- pnpm test:rbac

Test cases:

- limited benefit blocks after monthly limit
- unlimited benefit does not block
- canceled usage no longer counts against limit
- STAFF cannot cancel usage
- ADMIN or OWNER can cancel usage
- cancellation creates audit log

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

tasks/review/012-benefit-usage-limit-and-cancellation.md

Move task to review.
Do not start next task.