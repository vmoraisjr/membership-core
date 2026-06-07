# Production Readiness

## Status

Membership Core V1 is suitable for a controlled production pilot, not a broad
production rollout.

Pilot readiness is based on:

- passing production build
- current Prisma schema being up to date
- tenant isolation regression coverage
- RBAC regression coverage
- core membership, billing, contracts, modules, users and audit regression coverage

Pilot readiness is still conditional on the known limitations in
`docs/known-limitations.md`.

## Validated Baseline

Validated on June 7, 2026:

- `pnpm --dir apps/web exec prisma generate` ✅
- `pnpm --dir apps/web exec prisma migrate status` ✅
- `pnpm build` ✅
- `pnpm lint` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm test:tenant` ✅
- `pnpm test:rbac` ✅
- `pnpm test:membership` ✅
- `pnpm test:contracts` ✅
- `pnpm test:billing` ✅
- `pnpm test:modules` ✅
- `pnpm test:audit` ✅
- `pnpm test:users` ✅

## V1 Scope

In scope for pilot deployment:

- authentication
- clinic tenancy isolation
- users and RBAC
- patients
- membership plans and benefits
- subscriptions and benefit usage
- patient billing
- Nortex SaaS billing
- contracts
- dashboard
- audit log

Out of scope and not required for pilot sign-off:

- CRM expansion
- scheduling
- communication hub
- social integrations
- workflow automation
- payment gateway integrations

## Environment Variables

Required:

- `DATABASE_URL`

Optional:

- `APP_LOG_LEVEL=debug|info|warn|error`
- `ALLOW_AUTH_BOOTSTRAP=true`
- `NEXT_PUBLIC_ALLOW_ADMIN_BILLING=true`

Production guidance:

- keep `ALLOW_AUTH_BOOTSTRAP` disabled in production
- keep `NEXT_PUBLIC_ALLOW_ADMIN_BILLING` disabled unless that temporary override
  is explicitly part of the pilot operating model
- set `APP_LOG_LEVEL=info` or `warn` in pilot environments

## Migrations

Current audit result:

- 14 Prisma migrations are present
- `prisma migrate status` reports the database schema is up to date
- the current local pilot database is aligned with the checked-in migration history

Operational guidance:

- always take a backup before `prisma migrate deploy`
- rehearse migrations against a staging copy before production pilot deployment
- do not resolve failed migrations manually in production without capturing an
  incident note

## Build and Runtime Readiness

Validated:

- `next build` completes successfully
- TypeScript passes during build
- route generation completes for dashboard, auth and V1 operational pages

Warnings observed during build:

- `middleware.ts` uses a deprecated Next.js file convention and should be moved
  to the newer `proxy` convention in a follow-up hardening pass
- Prisma initialization currently logs a prefix of `DATABASE_URL`, which should
  be removed before a broader rollout

## Logging Readiness

Current state:

- server-side logging is centralized through `apps/web/lib/logger.ts`
- Prisma bootstrap failures are logged
- runtime log verbosity is configurable through `APP_LOG_LEVEL`

Current gaps:

- logs are console-based and not yet structured for a centralized log pipeline
- sensitive connection metadata is partially exposed by the Prisma bootstrap log
- there is no documented alerting or error-budget policy yet

## Test Coverage Readiness

Automated regression coverage currently exists for:

- tenant isolation
- RBAC
- membership engine
- contracts
- billing
- modules
- audit log
- user management

Coverage that still depends on manual QA:

- end-to-end browser flows across the full login-to-dashboard journey
- deployment smoke tests in the target runtime
- operator workflow validation with real pilot data volume

## Deployment Readiness Summary

Ready for pilot if all of the following are true:

- production or staging database backup is current
- deployment checklist is executed in full
- manual QA checklist is executed in full
- known limitations are accepted by the pilot stakeholders

Not yet ready for a broader production launch if any of the following remain
unaddressed:

- connection-string prefix logging
- deprecated Next middleware convention
- absence of a fully documented app container or hosting runbook
