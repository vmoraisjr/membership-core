# Task 015 - Disable Contracts For V1

## Objective

Disable the Contracts section from active V1 navigation and operational flow.

Contracts were implemented, but for V1 production they should not be exposed as an active module.

Do not delete contract code.

## Requirements

- remove Contracts from dashboard navigation/sidebar
- remove direct V1 UI entry points
- ensure contracts do not block subscription/payment flows
- keep contract code, tests and database structures intact
- document contracts as future/internal module

## Rules

- do not delete migrations
- do not delete tests
- do not remove contract side effects if they are required by existing tests unless intentionally adjusted
- contracts may remain internally available but not exposed in user-facing V1 UI

## Docs

Update:

- docs/v1-scope.md if exists
- docs/known-limitations.md
- docs/roadmap.md if needed

## Tests

Run:

pnpm test:tenant
pnpm test:rbac
pnpm test:membership
pnpm test:contracts
pnpm lint
pnpm --dir apps/web typecheck

## Report

Create:

tasks/review/015-disable-contracts-for-v1.md

Move task to review.
Do not start next task.