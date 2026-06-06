# Task 010 - Production Readiness

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

009-basic-dashboard


## Objective

Prepare V1 for real production testing.

## Requirements

Audit and implement:
- env validation
- seed demo data
- error boundaries
- logging baseline
- build validation
- lint/typecheck
- database migration sanity
- backup notes
- deployment checklist

Create:
- docs/production-readiness.md
- docs/deployment-checklist.md

## Acceptance Criteria

- App builds successfully.
- Demo environment can be seeded.
- Critical flows can be manually tested.
- Production checklist exists.
- CRM, scheduling and communication remain out of V1.


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

- `apps/web/lib/env.ts`
- `apps/web/lib/logger.ts`
- `apps/web/lib/auth/constants.ts`
- `apps/web/app/global-error.tsx`
- `apps/web/app/(dashboard)/error.tsx`
- `docs/production-readiness.md`
- `docs/deployment-checklist.md`
- `apps/web/prisma/migrations/20260606190000_billing_contracts_modules_dashboard_v1/migration.sql`

### Files Modified

- `apps/web/lib/prisma.ts`
- `apps/web/lib/auth/session.ts`
- `apps/web/features/auth/services/get-current-app-user.ts`
- `apps/web/package.json`
- `apps/web/prisma/seed.ts`
- `apps/web/middleware.ts`
- `apps/web/features/audit-log/services/get-audit-logs.ts`

### Decisions Made

- Centralized required env access and lightweight server logging so production
  failures surface more consistently
- Added global and dashboard error boundaries to avoid silent failures during
  production testing
- Expanded the seed into a demo environment that exercises the main V1 flows
  instead of only creating a clinic and plan
- Documented migration sanity checks, backup expectations and deployment steps

### What Was Intentionally Left Out

- No automated test harness was added because the project still lacks one
- No external observability vendor, alerting pipeline or secrets manager
  integration was introduced
- The deprecated Next.js `middleware` convention remains in place because
  replacing it with `proxy` was outside the current backlog scope

### Risks

- Live seed execution could not be completed in this session because the local
  PostgreSQL server at `localhost:5433` was unavailable and Docker Desktop was
  not running
- Prisma currently warns that `package.json#prisma.seed` is deprecated and
  should later move to `prisma.config.ts`
- Production readiness still depends on operators applying migrations and
  running the documented smoke tests in a real environment

### Validation

- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm --dir apps/web build` ✅
- `pnpm --dir apps/web db:seed` ⚠️ blocked because PostgreSQL at `localhost:5433` was unavailable
- Automated tests not run because the project does not define a test script

### Suggested Next Task

- Open a staging/UAT pass with the local database running so migrations and seed
  can be exercised end-to-end
