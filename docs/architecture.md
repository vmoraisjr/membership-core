Monorepo via Turborepo
Next.js + TypeScript
Prisma + PostgreSQL
Multi-tenant desde início
Feature-based architecture

# Folder Structure

features/

membership-plans
patients
subscriptions
membership-benefits
benefit-usage
dashboard

components/

dashboard
ui
layout

# CRUD Pattern
Every feature should contain:

actions/
components/
schemas/
services/

# UI Pattern
Dialog Pattern

<Entity>Dialog

Supports:

mode=create
mode=edit

# Row Actions Pattern
<Entity>RowActions

# Shared Components

DashboardPage
PageHeader
ConfirmDialog
DataTableContainer
MetricCard
SectionCard


# Date Handling
Server Layer:

Date

Client Layer:

Date | string

Always format with:

new Date(value)

# Current Status
Completed:

Plans
Patients
Benefits
Subscriptions

In Progress:

Benefit Usage

Planned:

Lifecycle
Dashboard Metrics
RBAC
CRM