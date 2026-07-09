# Future Modules

## Purpose

Track modules intentionally excluded from the active V1 scope while preserving
useful code for later phases.

## Dormant Modules

### CRM

- Repository status: implemented under `apps/web/features/crm`
- Route status: `apps/web/app/(dashboard)/dashboard/crm/page.tsx` now returns
  `notFound()` in V1
- Navigation status: removed from the dashboard sidebar
- Build expectation: CRM code stays in the repo but is not part of the active V1
  user flow

## Reserved Future Scope

- Leads and pipeline management
- Scheduling
- Calendar views
- Communication hub
- Inbox
- WhatsApp automation
- Instagram automation
- Email automation

## Reactivation Guidance

- Reintroduce dormant modules only through an explicit roadmap/task change.
- Restore navigation only after validating RBAC, tenant isolation, and build
  readiness for the module.
