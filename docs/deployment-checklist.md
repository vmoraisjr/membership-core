# Deployment Checklist

## Before Deploy

1. Confirm the release only contains V1 pilot scope.
2. Confirm the target environment has a valid `DATABASE_URL`.
3. Confirm `ALLOW_AUTH_BOOTSTRAP` is disabled.
4. Confirm `NEXT_PUBLIC_ALLOW_ADMIN_BILLING` is disabled unless explicitly approved.
5. Confirm the target PostgreSQL database has a fresh backup.
6. Confirm there are no unapplied or failed Prisma migrations.
7. Confirm the pilot team accepts the current items in `docs/known-limitations.md`.

## Pre-Deploy Validation

Run from the repository root unless noted:

```bash
pnpm --dir apps/web exec prisma generate
pnpm --dir apps/web exec prisma migrate status
pnpm lint
pnpm --dir apps/web typecheck
pnpm build
pnpm test:tenant
pnpm test:rbac
pnpm test:membership
pnpm test:contracts
pnpm test:billing
pnpm test:modules
pnpm test:audit
pnpm test:users
```

## Database Rollout

1. Run `pnpm --dir apps/web exec prisma migrate deploy`.
2. Confirm the command exits cleanly.
3. Confirm the database schema remains in sync with `prisma migrate status`.
4. If seed data is required for a non-production environment, run:

```bash
pnpm --dir apps/web exec prisma db seed
```

Do not seed shared production pilot data unless that activity is explicitly planned.

## Application Startup

1. Start the application with the production runtime command:

```bash
pnpm --dir apps/web start
```

2. Confirm the login page loads.
3. Confirm the dashboard loads for a clinic-scoped owner user.
4. Confirm no startup crash occurs during Prisma initialization.

## Smoke Test

1. Login with an owner user.
2. Open dashboard, patients, plans, subscriptions, billing, modules, users and audit log.
3. Confirm tenant-scoped data loads without cross-clinic leakage.
4. Confirm staff users cannot access billing, modules or user-management actions.
5. Confirm a subscription can still generate expected downstream records.
6. Confirm patient billing actions still work.
7. Confirm clinic SaaS billing status and invoices still render correctly.
8. Confirm Contracts is not exposed in active V1 navigation.
9. Confirm Membership remains active and future modules stay dormant.

## Post-Deploy Monitoring

1. Watch logs during first login, subscription, billing and any internal contract operations exercised by support workflows.
2. Confirm no unexpected Prisma initialization noise is exposing sensitive connection data.
3. Confirm no migration warnings remain unresolved.
4. Record any pilot-only workarounds in the release note or handoff note.
5. Capture any incident, failed step or manual intervention before broadening access.
