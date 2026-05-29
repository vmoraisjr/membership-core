# Membership Core - AI Context

## Project Overview

Membership Core is a SaaS platform for managing clinic membership programs.

The platform allows clinics to:

* Register patients
* Create membership plans
* Manage subscriptions
* Configure benefits
* Track membership operations

Current stage:

* Foundation complete
* CRUD layer under implementation
* Business rules not yet implemented
* Single-tenant prototype
* Future migration to multi-tenant SaaS

---

# Technology Stack

Frontend:

* Next.js 15 App Router
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

Backend:

* Next.js Server Actions
* Prisma ORM
* PostgreSQL

Forms:

* React Hook Form
* Zod

Notifications:

* Sonner

Icons:

* Lucide React

---

# Architecture Principles

Use Feature-First Architecture.

Never organize code by technical layer globally.

Always prefer:

features/<feature-name>

instead of:

components/
services/
pages/

for domain-specific logic.

---

# Folder Structure

apps/web

features/

dashboard/

membership-plans/

patients/

subscriptions/

membership-benefits/

shared components/

components/dashboard/

components/ui/

lib/

prisma/

---

# Standard Feature Structure

Every domain module should follow:

features/<module>

actions/

components/

schemas/

services/

hooks/ (optional)

types/ (optional)

Example:

features/membership-plans

actions

create-membership-plan.ts

update-membership-plan.ts

delete-membership-plan.ts

components

membership-plan-dialog.tsx

membership-plan-row-actions.tsx

membership-plans-page.tsx

plans-table.tsx

schemas

membership-plan.schema.ts

services

get-membership-plans.ts

---

# CRUD Architecture Pattern

Every CRUD module must use the same pattern.

Required:

1. Service
2. Schema
3. Create Action
4. Update Action
5. Delete Action
6. Reusable Dialog
7. Row Actions
8. Table
9. Page

---

# Dialog Pattern

Never create separate create/edit dialogs.

Always use:

<Entity>Dialog

Example:

MembershipPlanDialog

Supports:

mode?: "create" | "edit"

initialData?

trigger?

Example:

<MembershipPlanDialog />

and

<MembershipPlanDialog
mode="edit"
initialData={plan}
/>

---

# Row Actions Pattern

Every table row should expose:

Edit

Delete (or Cancel)

Pattern:

<Entity>RowActions

Example:

MembershipPlanRowActions

PatientRowActions

SubscriptionRowActions

MembershipBenefitRowActions

---

# Confirmation Pattern

Use shared component:

components/dashboard/confirm-dialog.tsx

Pattern:

<ConfirmDialog
title=""
description=""
onConfirm={}
trigger={}
/>

Never implement browser confirm().

---

# Table Pattern

Every table should use:

DataTableContainer

Table

TableHeader

TableBody

TableRow

TableCell

Standard column:

Actions

Last column only.

---

# Shared Dashboard Components

Current shared components:

components/dashboard

dashboard-page.tsx

page-header.tsx

metric-card.tsx

section-card.tsx

empty-state.tsx

confirm-dialog.tsx

table-actions.tsx

data-table-container.tsx

Always reuse existing components.

Do not create duplicates.

---

# Server Action Pattern

Always validate using Zod before database operations.

Pattern:

const parsed =
schema.safeParse(data);

if (!parsed.success)
throw new Error(...);

Then perform Prisma operation.

Then:

revalidatePath()

---

# Prisma Guidelines

Always use Prisma types when possible.

Example:

import type {
MembershipPlan
} from "@prisma/client";

Avoid:

any

Never use any unless absolutely unavoidable.

---

# Date Handling

Important:

Next.js App Router may serialize Date objects.

Therefore:

Dates crossing server/client boundaries may become strings.

Preferred UI types:

Date | string

When formatting:

new Date(value)

instead of:

value.toISOString()

unless value is guaranteed Date.

---

# Current Domain Modules

## Dashboard

Status:

Implemented

Contains:

Overview page

Metrics

Cards

Operational summary

Needs future real metrics integration.

---

## Membership Plans

Status:

Near completion

Implemented:

Create

Update

Delete

Dialog

Row Actions

Table

Page

Pending:

Validate final typing

Validate Actions column integration

---

## Patients

Status:

Near completion

Implemented:

Create

Update

Delete

Dialog

Table

Page

Pending:

Finalize row actions integration

Validate typing

Validate edit/delete flow

---

## Membership Benefits

Status:

Complete CRUD

Implemented:

Create

Update

Delete

Dialog

Row Actions

Table

Page

Schema

Services

Reference implementation for all future CRUDs.

---

## Subscriptions

Status:

In progress

Implemented:

Create

Update

Cancel

Dialog

Row Actions

Table

Page

Needs:

Date serialization cleanup

Typing stabilization

CRUD validation

---

# Current Product Scope

Patient

↓

Membership Plan

↓

Subscription

↓

Benefits

---

# Future Business Rules

Not implemented yet.

Planned:

Benefit validation

Benefit redemption

Usage tracking

Subscription lifecycle

Renewal

Pause

Reactivation

Expiration

Billing integration

---

# Future Multi-Tenant Architecture

Current:

Single clinic prototype.

Future:

Organization

Clinic

User

Role

Tenant isolation

clinicId filtering

Row-level access

---

# Code Generation Rules

When generating code:

1. Reuse existing patterns.
2. Reuse existing shared components.
3. Never create duplicate dialogs.
4. Never create duplicate page headers.
5. Never introduce any.
6. Use Prisma types.
7. Use Server Actions.
8. Follow Feature-First Architecture.
9. Preserve naming consistency.
10. Prefer editing existing files over creating new abstractions.

---

# Current Development Goal

Finish CRUD layer completely.

Checklist:

Membership Plans

Finalize table integration

Validate edit/delete flow

Patients

Finalize row actions

Validate edit/delete flow

Subscriptions

Finalize typing

Validate edit/cancel flow

Benefits

Validate completed CRUD

After CRUD completion:

Move to Business Layer implementation.
