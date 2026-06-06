# Production Readiness

## Scope

This readiness pass is limited to the V1 membership platform scope:

- Authentication and clinic tenancy
- Patients, plans, benefits and subscriptions
- Benefit usage validation
- Patient billing
- Nortex SaaS billing
- Contracts
- Basic dashboard

The following remain intentionally out of scope for V1 and must stay dormant:

- CRM expansion beyond the existing foundation
- Scheduling
- Communication hub
- Social channels
- Automation workflows

## Runtime Configuration

Required environment variables:

- `DATABASE_URL`

Optional environment variables:

- `ALLOW_AUTH_BOOTSTRAP=true`
  Use only in local or controlled demo environments when seeded fallback users
  are desired.
- `APP_LOG_LEVEL=debug|info|warn|error`
  Defaults to `debug` outside production and `info` in production.

## Seeded Demo Environment

The seed now provisions:

- Demo clinic `nortex-medical`
- One active patient
- One active membership plan
- Active and inactive benefits
- One active subscription
- Paid and overdue patient invoices
- Nortex clinic billing plan, clinic subscription and clinic invoice
- Global contract templates
- Patient and clinic contract records
- Module catalog plus clinic entitlements
- Demo users for `OWNER`, `ADMIN`, `STAFF`, `FINANCE` and `READ_ONLY`

Default demo password:

- `ChangeMe123!`

## Manual Test Focus

Run these flows before production testing:

1. Login with `OWNER` and confirm dashboard, billing, contracts and modules are visible.
2. Login with `STAFF` and confirm billing/contracts/modules admin actions stay hidden.
3. Create a new subscription for an active plan and verify an invoice plus patient contract are generated.
4. Try to create a subscription for an inactive plan and confirm the action is blocked.
5. Attempt to consume an inactive benefit and confirm validation fails.
6. Attempt to consume a benefit from a canceled or expired subscription and confirm validation fails.
7. Mark a patient invoice as paid and verify payment records and dashboard revenue update.
8. Mark a clinic invoice as overdue and verify the clinic SaaS subscription moves to `PAST_DUE`.
9. Visit billing, contracts and modules pages with a clinic-scoped admin account and confirm tenant data isolation.
10. Run the full validation commands from the deployment checklist before shipping.

## Migration Sanity

Before promoting the app:

1. Apply Prisma migrations against a fresh database.
2. Apply Prisma migrations against a copy of a populated environment.
3. Run `pnpm exec prisma generate`.
4. Run the seed in a demo environment and confirm it is idempotent enough for repeated local resets.
5. Validate that the new billing, module and contract enums exist in PostgreSQL.

## Logging and Failure Handling

- Server-side Prisma initialization now uses a shared logger instead of ad hoc
  console noise.
- Global and dashboard route error boundaries are present so production testing
  does not fail silently.
- Keep logs centralized in the target runtime platform and retain them across
  deploys to diagnose auth, billing and migration failures.

## Backups

Take a database backup:

- Before applying the new billing/contracts/modules migration in shared
  environments
- Before retrying a failed migration manually
- Before seeding data into any environment that already contains operator data

For production-like validation, prefer restoring the backup into a staging
database and rehearsing the migration there first.
