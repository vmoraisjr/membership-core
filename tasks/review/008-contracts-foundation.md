# Task 008 - Contracts Foundation

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

007-module-management


## Objective

Implement contract management for V1.

Contracts needed:
1. Clinic ↔ Patient
2. Nortex ↔ Clinic

## Requirements

Create or validate:
- ContractTemplate
- PatientContract
- PatientContractAcceptance
- ClinicContract
- ClinicContractFile
- ClinicContractStatus

Implement:
- create contract template
- generate patient contract from subscription
- accept patient contract
- create clinic contract record
- upload/reference clinic contract file if file handling exists
- view contract status

## Acceptance Criteria

- Patient subscription can be linked to a contract.
- Patient contract acceptance is recorded.
- Clinic contract with Nortex can be tracked.
- Contract access is permission-protected.


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

- `apps/web/features/contracts/services/contracts-foundation.ts`
- `apps/web/features/contracts/actions/accept-patient-contract.ts`
- `apps/web/features/contracts/components/contracts-page.tsx`
- `apps/web/app/(dashboard)/dashboard/contracts/page.tsx`

### Files Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/features/subscriptions/actions/create-subscription.ts`
- `apps/web/features/clinic/actions/create-clinic.ts`
- `apps/web/components/layout/dashboard-sidebar.tsx`

### Decisions Made

- Added global default templates for patient membership and clinic SaaS
  contracts to keep V1 contract generation deterministic
- Generated patient contracts directly from subscription enrollment so the legal
  record follows the operational flow
- Treated acceptance as an audited internal action rather than full external
  e-signature automation

### What Was Intentionally Left Out

- No PDF generation, external signature provider or file upload workflow
- No contract versioning UI beyond snapshotting the rendered content at create
  time

### Risks

- Contract acceptance remains an internal confirmation flow and not a formal
  digital-signature implementation
- Template changes do not retroactively update already-generated snapshots by
  design

### Validation

- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm --dir apps/web build` ✅
- Automated tests not run because the project does not define a test script

### Suggested Next Task

- `tasks/backlog/009-basic-dashboard.md`
