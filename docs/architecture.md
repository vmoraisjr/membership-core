Monorepo via Turborepo
Next.js 16 + TypeScript + App Router
Prisma + PostgreSQL
Multi-tenant SaaS
Feature-based architecture

# Folder Structure

```
apps/web
├── features/              # Domain-driven feature folders
│   ├── audit-log/
│   ├── auth/
│   ├── benefit-usage/
│   ├── clinic/
│   ├── crm/              # Leads, activities, notes
│   ├── dashboard/
│   ├── membership-benefits/
│   ├── membership-plans/
│   ├── patients/
│   ├── rbac/
│   ├── shared/
│   └── subscriptions/
├── components/           # Global UI components
│   ├── dashboard/
│   ├── ui/
│   └── layout/
├── lib/
├── prisma/
├── providers/
├── hooks/
├── services/
└── types/
```

# Feature Architecture Pattern

Each feature follows:

```
features/<feature-name>/
├── actions/           # Server actions (async operations)
├── components/        # React components
├── schemas/           # Zod validation schemas
├── services/          # Business logic
└── hooks/             # React hooks (if needed)
```

# Core CRUD Pattern

Every entity operation contains:

1. **Schema** (Zod) - Input validation
2. **Service** - Business logic
3. **Action** - Server action wrapper
4. **Component** - UI dialog/form
5. **Service** - Row actions handler

# UI Patterns

**Dialog Pattern**: `<Entity>Dialog`
- mode: "create" | "edit"
- onClose callback
- form inside dialog

**Row Actions Pattern**: `<Entity>RowActions`
- Edit action
- Delete action
- Custom actions

**Table Pattern**: `<Entity>DataTable`
- Uses DataTableContainer
- Built on shadcn/ui Table

# Shared Components

- **DashboardPage** - Layout wrapper
- **PageHeader** - Title + actions
- **ConfirmDialog** - Delete confirmation
- **DataTableContainer** - Table wrapper with pagination
- **MetricCard** - Dashboard metric display
- **SectionCard** - Content section wrapper

# Database Models (Current)

```
Core Domain:
- Clinic
- AppUser (for audit tracking)
- Patient
- Lead (CRM)
- LeadNote (CRM)
- LeadActivity (CRM)
- MembershipPlan
- MembershipBenefit
- Subscription
- BenefitUsage
- AuditLog
```

# Data Handling

Server Layer:
- Date stored as ISO strings in DB
- Use native Date type

Client Layer:
- Accept Date | string
- Always convert: new Date(value)
- Format with libraries (date-fns, dayjs)

# Multi-Tenant Implementation

- Every model has clinicId reference
- Queries filtered by current clinic
- RBAC enforced per tenant
- Audit trails isolated per clinic

# Date Handling Pattern

Server Actions:
```typescript
const startDate = new Date(input.startDate);
const endDate = new Date(input.endDate);
```

Components:
```typescript
const formatted = format(new Date(data.createdAt), 'dd/MM/yyyy');
```