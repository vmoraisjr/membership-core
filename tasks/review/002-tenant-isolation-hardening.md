# Task 002 - Tenant Isolation Hardening

## Context Verification

If the current session already contains the project context, architecture, roadmap and workflow instructions, do not reload the documentation.

Proceed directly to repository audit and task execution.

Only reload documentation when:

* Starting a new session
* Context has been lost
* A document was modified since the last review
* The task explicitly requires architectural review

Relevant documents:

* docs/ai-context.md
* docs/architecture.md
* docs/roadmap.md
* docs/codex-workflow.md

---

## Dependencies

Must be completed first:

* 001-authentication-foundation

---

## Objective

Audit and harden tenant isolation across the entire Membership Core platform.

The repository already contains evidence of tenant support:

* Clinic entity
* clinicId relationships
* tenant-aware services
* current user resolution

The goal of this task is NOT to introduce tenanting from scratch.

The goal is to guarantee that every query, mutation, metric and business operation is tenant-safe before production.

---

## Business Context

Membership Core is a multi-tenant SaaS.

A clinic must never:

* View another clinic's data
* Update another clinic's data
* Delete another clinic's data
* Consume another clinic's benefits
* Access another clinic's dashboard metrics
* Access another clinic's billing information

Tenant isolation is a production-critical requirement.

---

## Repository Audit

Audit the following modules:

### Patients

Verify:

* getPatients
* getPatientById
* createPatient
* updatePatient
* deletePatient

---

### Membership Plans

Verify:

* getMembershipPlans
* createMembershipPlan
* updateMembershipPlan
* deleteMembershipPlan

---

### Membership Benefits

Verify:

* getMembershipBenefits
* createMembershipBenefit
* updateMembershipBenefit
* deleteMembershipBenefit

---

### Subscriptions

Verify:

* getSubscriptions
* createSubscription
* updateSubscription
* cancelSubscription

---

### Benefit Usage

Verify:

* consumeBenefit
* validateBenefitUsage
* getBenefitUsageHistory
* getPatientBenefitBalance

---

### Billing

Verify:

* Patient Billing
* Clinic Billing
* Revenue Metrics

---

### Contracts

Verify:

* Patient Contracts
* Clinic Contracts

---

### Dashboard

Verify:

* getDashboardMetrics
* getActivePatients
* getActiveSubscriptions
* getMonthlyRevenue

---

### Audit Log

Verify:

* getAuditLogs
* createAuditLog

---

## Required Hardening

### Current Clinic Service

Create or validate:

```ts
getCurrentClinic()
```

This should be the canonical source of tenant context.

---

### Tenant Guard

Create or validate:

```ts
assertClinicAccess()
```

Usage:

* updates
* deletes
* sensitive reads

---

### Tenant Filters

Create or validate reusable helpers:

```ts
filterByClinic()
```

or equivalent pattern.

Avoid repeating tenant logic throughout the codebase.

---

## Query Validation

Search repository-wide for:

```ts
prisma.*.findMany()
prisma.*.findFirst()
prisma.*.findUnique()
prisma.*.update()
prisma.*.delete()
```

Verify every business query is scoped by:

```ts
clinicId
```

when applicable.

---

## Mutation Validation

Verify all mutations ensure:

```txt
Current User
↓
Current Clinic
↓
Target Entity
↓
Same Clinic
```

before executing.

---

## Dashboard Validation

Verify dashboard metrics are tenant-scoped.

Example:

Bad:

```ts
count all subscriptions
```

Good:

```ts
count subscriptions
where clinicId = currentClinic.id
```

---

## Security Audit

Produce a report listing:

### Safe

Operations already tenant-safe.

### Risky

Operations that rely on client-side filtering.

### Vulnerable

Operations with missing tenant validation.

---

## Acceptance Criteria

All V1 modules are tenant-safe.

Every sensitive query is clinic-scoped.

Every mutation validates clinic ownership.

Dashboard metrics are tenant-scoped.

No cross-tenant data exposure is possible.

Tenant helper utilities are centralized.

Security audit report is generated.

---

## Completion Workflow

1. Run lint.
2. Run typecheck.
3. Run tests if available.
4. Generate tenant isolation audit report.
5. Generate implementation report.
6. Move task to:

tasks/review

7. Never move task directly to done.

---

## Codex Execution Rules

1. Audit repository before modifying code.
2. Reuse existing tenant infrastructure.
3. Do not introduce a second tenant architecture.
4. Centralize tenant validation whenever possible.
5. Preserve feature-first architecture.
6. Execute only this task.
7. Stop after generating the report.
8. Do not start the next task automatically.

## Tenant Isolation Audit Summary

### Safe

- Patients: list and mutations are clinic-scoped
- Membership Plans: list and mutations are clinic-scoped
- Membership Benefits: list and mutations are relation-scoped to clinic plans
- Subscriptions: create, update and lifecycle actions scope through patient
  ownership
- Benefit Usage: validation, history and balance flows scope through
  subscription -> patient -> clinic
- Billing read flows scope patient and clinic invoices to the current clinic
- Contracts read and accept flows scope records to the current clinic
- Dashboard metrics scope tenant views to the current clinic, while
  platform-level metrics remain reserved for workspace operators
- Audit log reads are clinic-scoped

### Risky

- Internal server-side provisioning helpers still accept raw `clinicId` values:
  billing foundation, module provisioning and contract provisioning helpers
- Subscription lifecycle refresh writes still update by `id` after a prior
  tenant-scoped read

These are currently trusted internal paths, not exposed direct cross-tenant
 entry points.

### Vulnerable

- No known cross-tenant read or write vulnerability remained after this
  hardening pass

## Implementation Report

### Files Created

- `apps/web/lib/auth/tenant.ts`
- `docs/tenant-isolation-audit-report.md`

### Files Modified

- `apps/web/lib/auth/get-current-clinic.ts`
- `apps/web/lib/auth/assert-clinic-access.ts`
- `apps/web/features/audit-log/services/create-audit-log.ts`
- `apps/web/features/audit-log/services/get-audit-logs.ts`
- `apps/web/features/patients/services/get-patients.ts`
- `apps/web/features/membership-plans/services/get-membership-plans.ts`
- `apps/web/features/billing/services/billing-foundation.ts`

### Decisions Made

- Preserved the existing tenant architecture and centralized the reusable
  context/filter layer instead of introducing a second tenant abstraction
- Hardened audit log writes so clinic-scoped users cannot emit cross-tenant
  audit entries
- Added a reusable `filterByClinic()` helper for direct clinic-owned models and
  reused it in representative read paths
- Hardened clinic billing status sync with an optional clinic-bound invoice
  lookup

### What Was Intentionally Left Out

- No schema changes were needed
- No second tenanting framework or Prisma middleware layer was introduced
- Nested-relation clinic filters remain explicit where a simple direct
  `clinicId` helper would hide query intent
- No automated security test harness was added because the repository still
  does not include one

### Risks

- Some internal helper functions still accept raw `clinicId` values and depend
  on trusted callers
- Cross-tenant regression coverage is still manual because there is no
  integration test suite
- Future features that query through nested relations must keep tenant filters
  explicit and reviewed

### Validation

- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- Automated tests not run because the project does not define a test script

### Suggested Next Task

- Add integration tests that attempt cross-tenant reads and writes for critical
  billing, contracts and subscription flows
