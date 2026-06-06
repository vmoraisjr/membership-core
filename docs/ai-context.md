# Membership Core - AI Context

## Product Focus

Membership Core is a SaaS platform for managing healthcare clinic membership
operations.

The active V1 scope is limited to:

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
- Contracts
- Basic dashboard
- Production readiness

## Explicitly Out of Scope for V1

- CRM
- Leads and pipeline
- Scheduling
- Calendar
- Communication hub
- Inbox
- WhatsApp automation
- Instagram automation
- Email automation

These modules may remain in the repository as dormant code, but they must stay
out of active navigation and out of required production build paths.

## Current Engineering Direction

- Preserve feature-first architecture.
- Reuse shared dashboard and CRUD patterns.
- Keep clinic isolation in every query and mutation.
- Keep RBAC checks in place for active V1 modules.
- Prefer editing existing modules over creating parallel abstractions.

## Current Active Modules

- `features/auth`
- `features/clinic`
- `features/patients`
- `features/membership-plans`
- `features/membership-benefits`
- `features/subscriptions`
- `features/benefit-usage`
- `features/audit-log`
- `features/dashboard`
- `features/rbac`

## Dormant Modules

- `features/crm`

When working on future tasks, treat dormant modules as reference code only
unless the roadmap explicitly changes.
