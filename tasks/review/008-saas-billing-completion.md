# Task 008 - SaaS Billing Completion

## Objective

Complete Nortex SaaS Billing for V1 with an operational manual lifecycle for clinic subscriptions.

## Files Created

- `apps/web/features/billing/actions/activate-clinic-subscription.ts`
- `apps/web/features/billing/actions/cancel-clinic-subscription.ts`
- `apps/web/features/billing/actions/suspend-clinic-subscription.ts`
- `apps/web/features/billing/schemas/clinic-subscription.schema.ts`
- `tasks/review/008-saas-billing-completion.md`

## Files Modified

- `apps/web/features/billing/components/billing-page.tsx`
- `apps/web/features/billing/services/billing-foundation.ts`
- `apps/web/tests/billing/billing-hardening.test.ts`

## What Was Implemented

- Added explicit manual lifecycle support for clinic SaaS subscriptions:
  - `TRIAL`
  - `ACTIVE`
  - `PAST_DUE`
  - `SUSPENDED`
  - `CANCELED`
- Centralized allowed SaaS subscription transitions in the billing service.
- Added manual actions to activate, suspend and cancel the clinic SaaS subscription.
- Preserved `PAST_DUE` as the invoice-driven state when a clinic invoice is marked overdue.
- Prevented canceled clinic subscriptions from being auto-recreated by the billing foundation.
- Prevented invoice payment sync from resurrecting a canceled SaaS subscription.
- Extended the billing page to surface subscription dates and manual lifecycle controls.
- Added regression coverage for valid transitions, invalid post-cancel transitions and cancel-history preservation.

## Decisions Made

- Kept the V1 lifecycle manual and operator-driven instead of introducing scheduling or automated collections.
- Treated `CANCELED` as terminal in V1 to avoid implicit commercial reactivation.
- Reused the existing billing permission model instead of introducing a second admin surface.

## What Was Intentionally Left Out

- No payment gateway integration.
- No automatic trial expiration job.
- No automatic recurring invoice generation.
- No refund or credit-note workflow expansion beyond existing invoice/payment states.

## Risks

- Manual lifecycle control still depends on operator discipline.
- If Nortex later needs platform-only backoffice controls, the current clinic billing UI may need to be split from the operator workflow.

## Validation

- `pnpm test:billing` ✅
- `pnpm test:rbac` ✅
- `pnpm --dir apps/web typecheck` ✅
- `pnpm lint` ✅
