# Architecture Audit Report

## Completed Modules
- `membership-plans`
- `patients`
- `subscriptions`
- `membership-benefits`

All audited feature modules include:
- create action
- update action
- delete/cancel action
- service layer
- schema validation
- page component
- table component
- dialog component
- row action component

## Partial Modules
- `benefit-usage` — foundation created only
  - `apps/web/features/benefit-usage/actions`
  - `apps/web/features/benefit-usage/services`
  - `apps/web/features/benefit-usage/schemas`
  - `apps/web/features/benefit-usage/components`

## Missing Modules
- No audited feature modules were missing.
- `benefit-usage` now has a placeholder structure but is not fully implemented.

## Removed Duplications
- Removed duplicate `DashboardPage` implementation from `apps/web/components/dashboard/dashboard-page.tsx`
- Consolidated dashboard layout to `apps/web/components/layout/dashboard-page.tsx`
- Removed duplicate dashboard metric card from `apps/web/features/dashboard/components/metric-card.tsx`
- Verified no duplicate implementations for:
  - `page-header.tsx`
  - `section-card.tsx`
  - `empty-state.tsx`
  - `confirm-dialog.tsx`
  - `data-table-container.tsx`
  - `table-actions.tsx`

## Naming Standardization
- Renamed:
  - `membership-benefit-page.tsx` → `membership-benefits-page.tsx`
  - `membership-benefit-table.tsx` → `membership-benefits-table.tsx`
  - `membership-benefit-row-action.tsx` → `membership-benefit-row-actions.tsx`
  - `plans-table.tsx` → `membership-plans-table.tsx`
- Updated imports to use consistent feature naming patterns.

## Typing Improvements
- Removed direct Prisma model dependencies in UI component props for:
  - `membership-benefits` table and row actions
  - `subscriptions` table and dialog
  - `patients` table
- Standardized `Subscription` UI typing so `startedAt` and `expiresAt` are typed as `Date` in UI boundaries.
- Explicit DTOs now replace direct Prisma model props where beneficial.
- Verified no `any`, `unknown as any`, `ts-ignore`, or unnecessary ESLint suppressions remain in the app code.

## Date Standardization
- `apps/web/features/subscriptions/services/get-subscriptions.ts` now returns raw `Date` objects instead of string-converted dates.
- UI components now accept `Date` values for subscription date fields and use `new Date(value)` only at the formatting boundary.
- `subscription-dialog.tsx` now relies on stable `useWatch` bindings and memoized default date values.
- `Expiration date` is now a read-only field driven by `Start date` + 30 days.

## Remaining Technical Debt
- `benefit-usage` remains a placeholder foundation and requires implementation of actual usage logic, reset period handling, and UI flows.
- `membership-plans/hooks/` and `membership-plans/types/` directories appear unused and may need cleanup or consolidation.
- `benefit-usage` feature still needs page/table/dialog implementation beyond the placeholder.

## Recommended Next Sprint
1. Benefit Usage
   - Implement `BenefitUsage` lifecycle and usage limits
   - Add reset period enforcement and member benefit application logic
2. Subscription Lifecycle
   - Complete subscription cancel/reactivate/expiry transitions
   - Harden lifecycle guards and state changes in UI/actions
3. Dashboard Metrics
   - Surface subscription lifecycle metrics
   - Add benefit usage and active patient trend reporting

---

> This audit preserves the existing feature-first architecture, avoids new business feature additions, and focuses on cleanup, typing, and maintainability.
