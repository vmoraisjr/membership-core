# Membership Core Roadmap

## Active Roadmap: Lean V1 Production

Date: 2026-06-06

The active delivery scope is limited to the minimum production-ready membership
platform for clinics.

## In Scope

- Authentication
- Tenant / clinic isolation
- Users and roles
- Clinics
- Patients
- Membership plans
- Membership benefits
- Subscriptions
- Benefit usage
- Patient billing
- Nortex SaaS billing
- Basic dashboard
- Production readiness

## Out of Scope for V1

- CRM
- Leads
- Pipeline
- Scheduling
- Calendar
- Communication hub
- Inbox
- WhatsApp automation
- Instagram automation
- Email automation

## Execution Order

1. `tasks/backlog/001-authentication-foundation.md`
2. `tasks/backlog/002-tenant-isolation.md`
3. `tasks/backlog/003-user-roles-permissions.md`
4. `tasks/backlog/004-membership-engine-stabilization.md`
5. `tasks/backlog/005-patient-billing.md`
6. `tasks/backlog/006-saas-billing-nortex-clinic.md`
7. `tasks/backlog/007-module-management.md`
8. `tasks/backlog/008-contracts-foundation.md`
9. `tasks/backlog/009-basic-dashboard.md`
10. `tasks/backlog/010-production-readiness.md`

## Scope Rules

- Future modules may remain in the repository as dormant code.
- Dormant modules must not appear in active navigation.
- Dormant modules must not be required for the production build.
- Contracts currently follow the same dormant-navigation rule for V1 even though
  the internal foundation remains in the repository.
- New tasks should follow this roadmap unless a later scope-reset task changes it.
