# Deployment Checklist

## Pre-Deploy

1. Confirm the release contains only V1 scope work.
2. Confirm `DATABASE_URL` is present for the target environment.
3. Confirm `ALLOW_AUTH_BOOTSTRAP` is disabled in production.
4. Confirm the target database has a current backup.
5. Review pending Prisma migrations and expected enum changes.

## Validation Commands

Run from the repository root unless noted:

```bash
pnpm --dir apps/web exec prisma generate
pnpm lint
pnpm --dir apps/web exec tsc --noEmit
pnpm --dir apps/web build
pnpm --dir apps/web exec prisma db seed
```

If the environment does not define a test script yet, record that gap in the
release notes instead of silently skipping it.

## Release Gate

1. Verify login works for a clinic-scoped admin user.
2. Verify tenant-scoped dashboard metrics render.
3. Verify patient billing actions work.
4. Verify clinic SaaS billing actions work.
5. Verify contracts page loads and accepts a pending patient contract.
6. Verify modules page shows Membership as always-on and keeps future modules dormant.
7. Verify no CRM, scheduling or communication routes were revived for V1.

## Post-Deploy

1. Watch application logs during the first login and billing interactions.
2. Confirm Prisma migrations finished cleanly.
3. Confirm seeded demo data is only present where expected.
4. Re-run a smoke test on dashboard, subscriptions, billing, contracts and modules.
5. Record any follow-up defects before opening production testing to a broader group.
