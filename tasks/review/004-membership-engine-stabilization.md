# Task 004 - Membership Engine Stabilization

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

003-user-roles-permissions


## Objective

Stabilize the existing Membership Core engine for production V1.

## Scope

Audit and harden:
- Patients
- Membership Plans
- Membership Benefits
- Subscriptions
- Benefit Usage

## Requirements

Validate:
- CRUD completeness
- tenant safety
- permission checks
- status transitions
- benefit usage limits
- subscription lifecycle
- empty states
- error states

Implement missing production rules:
- inactive plan cannot receive new subscription
- inactive benefit cannot be consumed
- canceled subscription cannot consume benefit
- expired subscription cannot consume benefit
- usage limits respected

## Acceptance Criteria

- Membership flow works end-to-end.
- Benefit consumption is validated.
- Subscription lifecycle is reliable.
- No out-of-scope modules are required.


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

- `apps/web/features/subscriptions/actions/create-subscription.ts`
- `apps/web/features/subscriptions/actions/renew-subscription.ts`
- `apps/web/features/benefit-usage/services/validate-benefit-usage.ts`

### Decisions Made

- Blocked new subscriptions when the selected membership plan is inactive
- Reused evaluated subscription lifecycle rules before benefit consumption so
  canceled and expired subscriptions cannot consume benefits
- Added explicit inactive-benefit validation instead of relying only on query
  filters so the rule remains obvious and defensive

### What Was Intentionally Left Out

- No new out-of-scope CRM, scheduling or communication flows were introduced
- No dedicated automated test suite was added because the repository still does
  not expose a test script or harness

### Risks

- Subscription lifecycle reliability still depends on operators running the
  existing lifecycle actions consistently
- Benefit usage remains a manual workflow, so future concurrency controls may be
  needed if simultaneous usage recording becomes common

### Validation

- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm --dir apps/web build` ✅
- Automated tests not run because the project does not define a test script

### Suggested Next Task

- `tasks/backlog/005-patient-billing.md`
