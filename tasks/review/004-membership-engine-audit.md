# Task 004 - Membership Engine Production Audit

## Summary

This audit was executed without implementing or refactoring application code.

Overall V1 state:

- Core SaaS foundation: mostly implemented, with user management still needing hardening.
- Membership engine: implemented end-to-end for V1, but missing a dedicated membership regression command.
- Commercial layer: largely implemented, with contracts and audit coverage still lighter than the rest.
- Operational layer: dashboard and production docs exist; validation pipeline is still incomplete.

---

## Core SaaS Foundation

### Authentication

- Status: COMPLETED
- Evidence:
  - `apps/web/features/auth/actions/login.ts`
  - `apps/web/features/auth/actions/logout.ts`
  - `apps/web/features/auth/services/authenticate-app-user.ts`
  - `apps/web/features/auth/services/create-auth-session.ts`
  - `apps/web/app/(auth)/login/page.tsx`
- What works:
  - Session-based authentication exists.
  - Password reset and invite acceptance entry points exist.
  - Auth persistence is backed by `AuthSession` in Prisma.
- What is missing:
  - No evidence of external delivery for invites or reset emails.
  - Auth bootstrap accounts remain part of the runtime model for non-production or explicitly enabled environments.
- Risk Level: MEDIUM
- Recommendation: Small hardening task

### Current User Resolution

- Status: COMPLETED
- Evidence:
  - `apps/web/features/auth/services/get-current-app-user.ts`
  - `apps/web/features/auth/services/get-current-user-role.ts`
  - `apps/web/lib/auth/get-current-clinic.ts`
- What works:
  - Current user resolution is session-backed.
  - Clinic-aware resolution exists through `requireCurrentAppUser()` and `getCurrentClinicId()`.
  - Test-only overrides exist for deterministic regression coverage.
- What is missing:
  - The service still contains default-user bootstrap behavior, which increases operational complexity.
- Risk Level: LOW
- Recommendation: No action needed

### User Invites

- Status: PARTIAL
- Evidence:
  - `apps/web/features/auth/actions/create-user-invite.ts`
  - `apps/web/features/auth/services/create-user-invite.ts`
  - `apps/web/features/auth/actions/accept-user-invite.ts`
  - `apps/web/app/(auth)/invite/page.tsx`
- What works:
  - Invite creation is permission-guarded.
  - Invite acceptance creates the account binding with clinic and role.
  - Expiry and invalid-token checks exist.
- What is missing:
  - No email delivery workflow.
  - Invite lifecycle management is minimal; no resend/revoke flow is present.
- Risk Level: MEDIUM
- Recommendation: Small hardening task

### User Management

- Status: PARTIAL
- Evidence:
  - `apps/web/app/(dashboard)/dashboard/users/page.tsx`
  - `apps/web/features/users/components/users-page.tsx`
  - `apps/web/features/users/services/get-clinic-users-overview.ts`
  - `apps/web/features/users/actions/update-clinic-user-role.ts`
- What works:
  - Clinic-scoped roster and invite history exist.
  - Owner-driven role reassignment exists.
  - Last-owner protection and self-role-change protection are implemented.
- What is missing:
  - No user deactivation/removal lifecycle.
  - No password-management controls for operators.
  - No audit entity coverage dedicated to user-management changes.
- Risk Level: MEDIUM
- Recommendation: Small hardening task

### RBAC

- Status: COMPLETED
- Evidence:
  - `apps/web/features/rbac/permissions.ts`
  - `apps/web/features/rbac/services/assert-permission.ts`
  - `apps/web/tests/rbac/rbac-hardening.test.ts`
- What works:
  - Central permission matrix exists.
  - Server-side permission assertions are used across protected actions.
  - UI permission gating exists on major dashboard surfaces.
- What is missing:
  - No dedicated audit coverage for user-management authorization events.
- Risk Level: LOW
- Recommendation: No action needed

### Tenant Isolation

- Status: COMPLETED
- Evidence:
  - `apps/web/lib/auth/tenant.ts`
  - `apps/web/lib/auth/assert-clinic-access.ts`
  - `apps/web/lib/auth/get-current-clinic.ts`
  - `docs/tenant-isolation-audit-report.md`
- What works:
  - Clinic-scoped query helpers exist.
  - Current-clinic resolution is enforced in services and actions.
  - Cross-tenant mutation paths were hardened around current clinic ownership.
- What is missing:
  - Some services still mix `getCurrentClinic()` and `filterByClinic()` patterns rather than using one uniform abstraction.
- Risk Level: LOW
- Recommendation: No action needed

### Cross-Tenant Regression Tests

- Status: COMPLETED
- Evidence:
  - `apps/web/tests/tenant-isolation/cross-tenant-regression.test.ts`
  - `tasks/review/002.1-cross-tenant-regression-tests.md`
- What works:
  - Automated fixtures cover Alpha and Beta clinics.
  - The suite validates list, update, delete, dashboard, billing, contracts and user isolation.
  - Test data is isolated from development flows.
- What is missing:
  - Execution stability depends on the local runner environment; the suite exists but is sensitive to sandbox/bootstrap failures in this session.
- Risk Level: LOW
- Recommendation: No action needed

---

## Membership Engine

### Patients

- Status: COMPLETED
- Evidence:
  - `apps/web/features/patients/actions/create-patient.ts`
  - `apps/web/features/patients/actions/update-patient.ts`
  - `apps/web/features/patients/actions/suspend-patient.ts`
  - `apps/web/features/patients/components/patients-page.tsx`
- What works:
  - CRUD-style create/update/suspend/reactivate flows exist.
  - Permanent delete is role-protected.
  - Patient listing resolves current subscription context.
- What is missing:
  - No dedicated patient-specific regression suite outside the broader tenant and RBAC tests.
- Risk Level: LOW
- Recommendation: No action needed

### Membership Plans

- Status: COMPLETED
- Evidence:
  - `apps/web/features/membership-plans/actions/create-membership-plan.ts`
  - `apps/web/features/membership-plans/actions/update-membership-plan.ts`
  - `apps/web/features/membership-plans/actions/clone-membership-plan.ts`
  - `apps/web/features/membership-plans/components/membership-plans-page.tsx`
- What works:
  - Plan creation, update, clone, deactivate, reactivate and protected permanent delete exist.
  - Plan reads are clinic-scoped and include linked benefits/subscriptions.
- What is missing:
  - No dedicated end-to-end membership suite verifies all plan lifecycle transitions together.
- Risk Level: LOW
- Recommendation: No action needed

### Membership Benefits

- Status: COMPLETED
- Evidence:
  - `apps/web/features/membership-benefits/actions/create-membership-benefit.ts`
  - `apps/web/features/membership-benefits/actions/update-membership-benefit.ts`
  - `apps/web/features/membership-benefits/actions/deactivate-membership-benefit.ts`
  - `apps/web/features/membership-benefits/components/membership-benefits-page.tsx`
- What works:
  - Benefit lifecycle actions and UI exist.
  - Benefit reads are scoped through clinic-owned plans.
  - Permanent delete is protected.
- What is missing:
  - No dedicated membership-engine regression command covers benefit mutation plus consumption together.
- Risk Level: LOW
- Recommendation: No action needed

### Subscriptions

- Status: COMPLETED
- Evidence:
  - `apps/web/features/subscriptions/actions/create-subscription.ts`
  - `apps/web/features/subscriptions/actions/update-subscription.ts`
  - `apps/web/features/subscriptions/actions/cancel-subscription.ts`
  - `apps/web/features/subscriptions/services/get-subscriptions.ts`
- What works:
  - Subscription lifecycle operations exist for create, update, pause, resume, renew, expire and cancel.
  - Status evaluation logic runs on read and updates stale persisted lifecycle state.
  - Subscription UI supports filtered operational management.
- What is missing:
  - No standalone `test:membership` command validates subscription lifecycle regressions as a first-class pipeline stage.
- Risk Level: MEDIUM
- Recommendation: Small hardening task

### Benefit Usage

- Status: COMPLETED
- Evidence:
  - `apps/web/features/benefit-usage/actions/consume-benefit.ts`
  - `apps/web/features/benefit-usage/services/validate-benefit-usage.ts`
  - `apps/web/features/benefit-usage/services/get-patient-benefit-balance.ts`
  - `apps/web/features/benefit-usage/components/benefit-usage-history-page.tsx`
- What works:
  - Consumption is validated against subscription status, plan ownership and usage limits.
  - Benefit balance and usage history screens exist.
  - Usage is wired into dashboard metrics and audit flows.
- What is missing:
  - No dedicated regression command for benefit consumption edge cases.
- Risk Level: MEDIUM
- Recommendation: Small hardening task

---

## Commercial Layer

### Patient Billing

- Status: COMPLETED
- Evidence:
  - `apps/web/features/billing/services/billing-foundation.ts`
  - `apps/web/features/billing/actions/mark-patient-invoice-paid.ts`
  - `apps/web/features/billing/actions/mark-patient-invoice-overdue.ts`
  - `apps/web/features/billing/components/billing-page.tsx`
- What works:
  - Patient invoices are created from subscription context.
  - Manual payment-state operations exist.
  - Reads and mutations are clinic-scoped and permission-gated.
- What is missing:
  - No dedicated billing regression command beyond tenant and RBAC coverage.
- Risk Level: LOW
- Recommendation: No action needed

### Nortex / Clinic SaaS Billing

- Status: COMPLETED
- Evidence:
  - `apps/web/features/billing/services/billing-foundation.ts`
  - `apps/web/features/billing/actions/mark-clinic-invoice-paid.ts`
  - `apps/web/features/billing/actions/mark-clinic-invoice-overdue.ts`
  - `tasks/review/006-saas-billing-nortex-clinic.md`
- What works:
  - Default clinic commercial plan creation exists.
  - Clinic subscription and clinic invoice foundation exist.
  - Platform metrics are available for non-clinic owner/admin contexts.
- What is missing:
  - Commercial automation remains manual; there is no recurring invoicing scheduler in evidence.
- Risk Level: MEDIUM
- Recommendation: Small hardening task

### Module Management

- Status: COMPLETED
- Evidence:
  - `apps/web/features/modules/services/module-access.ts`
  - `apps/web/features/modules/actions/enable-clinic-module.ts`
  - `apps/web/features/modules/actions/disable-clinic-module.ts`
  - `apps/web/features/modules/components/modules-page.tsx`
- What works:
  - Owner-restricted module enable/disable flows exist.
  - Core membership module remains protected from being disabled.
  - Commercial future modules are represented without being fully activated.
- What is missing:
  - No deeper entitlement model beyond enabled/disabled clinic module state.
- Risk Level: LOW
- Recommendation: No action needed

### Contracts

- Status: PARTIAL
- Evidence:
  - `apps/web/features/contracts/services/contracts-foundation.ts`
  - `apps/web/features/contracts/actions/accept-patient-contract.ts`
  - `apps/web/features/contracts/components/contracts-page.tsx`
  - `tasks/review/008-contracts-foundation.md`
- What works:
  - Default patient and clinic contract templates are provisioned.
  - Patient contracts can be generated from subscriptions.
  - Patient contract acceptance is implemented and RBAC-protected.
  - Clinic contract overview exists.
- What is missing:
  - Contract template authoring/editing is not present.
  - File handling on clinic contracts exists in schema but not as a surfaced workflow in the audited files.
  - Contract module appears foundational rather than fully operational.
- Risk Level: MEDIUM
- Recommendation: Full implementation task

---

## Operational Layer

### Dashboard

- Status: COMPLETED
- Evidence:
  - `apps/web/features/dashboard/services/get-dashboard-metrics.ts`
  - `apps/web/features/dashboard/components/dashboard-home-page.tsx`
  - `tasks/review/009-basic-dashboard.md`
- What works:
  - Dashboard aggregates active patients, subscriptions, usage and revenue.
  - Platform metrics are separated from clinic metrics.
  - Role-gated dashboard access exists.
- What is missing:
  - The dashboard is intentionally basic and not yet backed by dedicated visual regression or analytics-specific tests.
- Risk Level: LOW
- Recommendation: No action needed

### Audit Log

- Status: PARTIAL
- Evidence:
  - `apps/web/features/audit-log/services/create-audit-log.ts`
  - `apps/web/features/audit-log/services/get-audit-logs.ts`
  - `apps/web/features/audit-log/components/audit-log-page.tsx`
  - `tasks/review/006-audit-log.md`
- What works:
  - Audit records and audit list UI exist.
  - Logs are clinic-scoped and filterable.
  - Major lifecycle actions have evidence of audit integration from prior tasks.
- What is missing:
  - Coverage is not yet comprehensive across every administrative event, especially user-management changes.
  - There is no dedicated audit regression suite.
- Risk Level: MEDIUM
- Recommendation: Small hardening task

### Production Readiness Docs

- Status: COMPLETED
- Evidence:
  - `docs/production-readiness.md`
  - `docs/deployment-checklist.md`
  - `docs/architecture-audit-report.md`
  - `tasks/review/010-production-readiness.md`
- What works:
  - Deployment and operational docs exist.
  - The repo contains production-readiness reporting from prior tasks.
- What is missing:
  - None obvious from the audited files for V1 documentation scope.
- Risk Level: LOW
- Recommendation: No action needed

### Test Commands

- Status: PARTIAL
- Evidence:
  - `package.json`
  - `apps/web/package.json`
  - `apps/web/tests/tenant-isolation/cross-tenant-regression.test.ts`
  - `apps/web/tests/rbac/rbac-hardening.test.ts`
- What works:
  - `pnpm test:tenant` exists.
  - `pnpm test:rbac` exists.
  - `pnpm lint` exists.
  - `pnpm --dir apps/web typecheck` exists.
- What is missing:
  - `pnpm test:membership` does not exist.
  - The validation pipeline does not yet provide a dedicated regression stage for membership lifecycle and benefit usage flows.
- Risk Level: HIGH
- Recommendation: Full implementation task

---

## Mandatory Command Check

| Command | Exists | Should be in V1 pipeline | Notes |
| --- | --- | --- | --- |
| `pnpm test:tenant` | Yes | Yes | Cross-tenant regression suite exists at app level and root wrapper. |
| `pnpm test:rbac` | Yes | Yes | RBAC hardening suite exists at app level and root wrapper. |
| `pnpm test:membership` | No | Yes | Missing dedicated membership-engine regression command. |
| `pnpm lint` | Yes | Yes | Root wrapper via Turbo exists. |
| `pnpm --dir apps/web typecheck` | Yes | Yes | App-level typecheck script exists. |

---

## Final Assessment

The repository is no longer in a greenfield state. Most V1 foundation and core membership capabilities are already implemented. The strongest remaining gaps are:

1. Dedicated membership regression coverage and a first-class `test:membership` command.
2. Hardening and fuller lifecycle coverage for user management.
3. A more complete contracts surface.
4. Broader audit-log coverage for administrative events.

The next safest implementation task is a focused membership regression/hardening pass rather than a new large feature area.
