
---

```md
# Task 021 - Portuguese QA Sweep

## Objective

Perform a final Portuguese Brazil QA sweep across the active V1 application.

Do not implement new product features.

Do not change visual identity.

Only fix translation consistency, hardcoded English and user-facing wording.

---

## Dependencies

Must be completed first:

- 017-i18n-foundation-pt-br
- 018-translate-core-navigation-layout
- 019-translate-membership-core-modules
- 020-translate-billing-users-modules-audit

---

## Scope

Audit the entire active V1 UI for English text.

Check:

- pages
- dialogs
- forms
- buttons
- tables
- empty states
- success toasts
- error toasts
- confirmation dialogs
- dashboard metrics
- navigation
- auth screens
- validation messages

---

## Search Strategy

Search repository for common English terms:

```txt
Create
Edit
Delete
Cancel
Save
Patient
Plan
Benefit
Subscription
Billing
Payment
Invoice
User
Role
Settings
Dashboard
Active
Inactive
Pending
Overdue
Failed