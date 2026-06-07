# Known Limitations

## Production Rollout Scope

- The current state is appropriate for a controlled pilot, not a broad production rollout.
- Several operational safeguards are documented but still manual.

## Logging

- Prisma initialization currently logs a prefix of `DATABASE_URL`, which is more connection metadata than production logs should expose.
- Logging is console-based and not yet integrated with a structured centralized logging pipeline.
- No documented alerting, log retention or on-call escalation flow is included in the repository.

## Framework and Runtime

- `apps/web/middleware.ts` uses a deprecated Next.js convention and should be migrated to the newer `proxy` convention.
- The repository includes a local PostgreSQL Docker Compose file, but not a full application container image or hosting-specific runtime manifest.

## Environment and Secrets

- There is no checked-in `.env.example` or formal environment contract beyond code and docs.
- Environment validation is lightweight and currently enforces only `DATABASE_URL` as strictly required at runtime.

## Data and Operations

- Billing remains manual in V1. There are no payment gateway integrations, automatic collections or recurring billing jobs.
- SaaS subscription lifecycle changes are operator-driven and depend on disciplined manual handling.
- Failed migration recovery is not fully automated; operator judgment is still required if a deploy fails mid-migration.

## Test Coverage Boundaries

- Regression coverage is strong at the service and action layer, but there is no browser E2E suite yet.
- Real production-like load, concurrency and long-running session behavior are not validated by the current automated suite.

## Out of Scope Modules

- CRM, Scheduling and Communication remain intentionally dormant for V1 and should not be treated as pilot-ready modules.
- Any route or navigation exposure for dormant modules should be treated as a regression.
