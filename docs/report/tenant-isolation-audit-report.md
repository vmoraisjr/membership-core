# Tenant Isolation Audit Report

## Scope

Audit executed for:

- Patients
- Membership Plans
- Membership Benefits
- Subscriptions
- Benefit Usage
- Billing
- Contracts
- Dashboard
- Audit Log

## Canonical Tenant Helpers

Tenant context is now centralized through:

- `getCurrentClinic()` in `apps/web/lib/auth/get-current-clinic.ts`
- `getCurrentClinicContext()` in `apps/web/lib/auth/tenant.ts`
- `assertClinicAccess()` in `apps/web/lib/auth/assert-clinic-access.ts`
- `filterByClinic()` in `apps/web/lib/auth/tenant.ts`

## Safe

These operations already enforce tenant boundaries through direct `clinicId`
 filters or relation-scoped queries:

- Patient list and patient mutations
- Membership plan list and plan mutations
- Membership benefit list and benefit mutations
- Subscription create, update and lifecycle actions
- Benefit usage validation and usage history
- Dashboard active-patient, active-subscription and benefit-consumption metrics
- Billing UI queries for patient invoices and clinic invoices
- Contracts UI queries and acceptance action
- Audit log reads

## Risky

These paths are server-side only, but they depend on trusted caller context and
 therefore need continued discipline:

- Internal provisioning helpers that accept `clinicId` directly:
  `ensureClinicBillingFoundation()`, `createPatientInvoiceForSubscription()`,
  `ensureClinicModules()`, `ensureClinicContractRecord()`,
  `generatePatientContractForSubscription()`
- Subscription status auto-refresh writes that update rows by `id` after a
  tenant-scoped read in `getSubscriptions()` and
  `evaluateSubscriptionStatus()`

These are not currently exposed as user-controlled cross-tenant mutations, but
 they rely on upstream tenant scoping remaining intact.

## Vulnerable

No known cross-tenant read or write vulnerability remained after this
 hardening pass.

The main issue found during the audit was weaker-than-ideal centralization:

- Audit logging accepted arbitrary `clinicId` values from callers
- Billing subscription-status synchronization accepted invoice IDs without an
  optional clinic ownership check
- Several tenant-safe queries repeated inline `clinicId` filters instead of
  using a central helper

Those issues were hardened in this task.

## Hardening Applied

- Added reusable `getCurrentClinicContext()` and `filterByClinic()` helpers
- Hardened `createAuditLog()` so clinic-scoped users cannot emit cross-tenant
  audit events
- Hardened clinic billing synchronization with optional clinic-bound invoice
  lookup
- Reused the central tenant helper in representative patient, plan, audit-log
  and billing query paths

## Residual Risks

- The codebase still contains some server-only helper functions that accept
  `clinicId` explicitly and rely on trusted callers
- There is no automated security test suite for cross-tenant regression checks
- Future modules must keep tenant filters explicit when querying through nested
  relations rather than direct `clinicId` columns

## Recommended Follow-Up

1. Add automated integration tests that attempt cross-tenant reads and writes.
2. Keep new business services on top of `getCurrentClinicContext()` and
   `filterByClinic()` by default.
3. Treat any new helper that accepts raw `clinicId` as a design review point.
