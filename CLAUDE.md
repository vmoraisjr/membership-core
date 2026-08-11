# Membership Core — Claude Code Context

## Product

Membership Core V1 is a multi-tenant SaaS for:

- clinics
- patients
- membership plans
- benefits
- subscriptions
- benefit usage
- payments
- users and roles
- SaaS billing

CRM, scheduling and communication are out of scope for V1.

## Read Only When Needed

Project documentation:

- docs/ai-context.md
- docs/architecture.md
- docs/roadmap.md
- docs/codex-workflow.md
- docs/current-state.md
- docs/production-readiness.md
- docs/known-limitations.md

Do not reread all documents when the current session already contains the context.

## Architecture

- Turborepo monorepo
- Next.js App Router
- TypeScript strict
- Prisma
- PostgreSQL
- feature-first architecture
- Server Actions
- Zod
- React Hook Form
- shadcn/ui
- pt-BR i18n

## Mandatory Rules

- Audit before editing.
- Reuse existing implementations.
- Do not create duplicate services, dialogs or permission systems.
- Preserve tenant isolation.
- Preserve RBAC enforcement on server actions.
- Do not use `any`.
- Do not change Prisma schema without a migration.
- Do not delete migrations.
- Do not modify CRM, scheduling or communication modules.
- Interface redesign is approved: adopt the Sheep visual identity (emerald/cyan brand palette `#0EA968` → `#06B6D4`, animated collapsible sidebar, metric cards with sparklines, motion/micro-interactions) validated in design exploration, rolled out across screens incrementally.
- Never start the next task automatically.
- Completed tasks must move to `tasks/review`, never directly to `done`.

## Validation

Run when relevant:

pnpm test:tenant
pnpm test:rbac
pnpm test:membership
pnpm test:contracts
pnpm test:billing
pnpm test:modules
pnpm test:audit
pnpm test:users
pnpm lint
pnpm --dir apps/web typecheck
pnpm build

## Current Workflow

1. Read the requested task.
2. Audit current implementation.
3. Present a short plan.
4. Implement only the task scope.
5. Run validations.
6. Create implementation report.
7. Move task to review.
8. Stop.