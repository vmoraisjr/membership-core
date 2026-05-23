# Membership Core

Multi-tenant membership and benefits platform designed for clinics, healthcare providers and future loyalty ecosystems.

## Vision

Membership Core is a configurable platform for managing recurring subscription plans, benefits, dependents and benefit usage.

The initial MVP focuses on medical clinics, allowing them to:

- Create membership plans
- Configure benefits and discounts
- Manage patients and dependents
- Control benefit usage
- Track payments and subscriptions
- Provide a patient portal with usage history and QR Code access

The architecture is designed to evolve into a broader membership and loyalty ecosystem for multiple business segments.

---

# Tech Stack

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL

## Monorepo
- Turborepo
- pnpm workspace

---

# Project Structure

```txt
/apps
  /web                → Main web application

/packages
  /config             → Shared configurations
  /contracts          → Shared types and contracts
  /database           → Prisma schema and database layer
  /ui                 → Shared UI components

/docs
  architecture.md
  business-rules.md
  domain.md
  roadmap.md
  vision.md

---

# Fluxo de desenvolvimento
1. Limpar boilerplate do Next

Remover:

página default
SVGs
textos padrão
2. Setup shadcn/ui
3. Definir arquitetura oficial

Completar:

domain.md
architecture.md
business-rules.md
4. Prisma + PostgreSQL
5. Auth + roles
6. Primeiro módulo:
Membership Plans

