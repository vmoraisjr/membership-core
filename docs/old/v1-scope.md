# Membership Core V1 Scope

## Goal

Ship a production-testable SaaS version as fast as possible.

## In Scope

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
- Basic dashboard
- Production readiness

## Out of Scope

- CRM
- Leads
- Pipeline
- Scheduling
- Calendar
- Communication Hub
- Inbox
- WhatsApp
- Instagram
- Email automation
- Advanced visual refresh
- Contracts as an active operator-facing V1 module

## Internal / Future Modules

- Contracts remain implemented internally for downstream automation and
  regression coverage, but are intentionally removed from active V1 navigation.

## Principle

Do not delete future modules unless necessary.
Keep them dormant and outside active navigation/build paths where possible.
