# 13-cards.md

# Sheep Cards

## 1. Purpose

Cards group related information and actions.

A card should make information easier to scan, not create visual decoration.

## 2. Principle

> A card is a decision container.

If the card does not support understanding or action, it probably should not exist.

## 3. Types

### Summary Card

Used for KPIs and short metrics.

Contains:

- Label
- Value
- Optional trend
- Optional supporting text

### Action Card

Used for recommended tasks or quick actions.

Contains:

- Title
- Description
- Action

### Entity Card

Used to represent a customer, plan, subscription or payment.

Contains:

- Main identifier
- Status
- Key metadata
- Primary contextual action

### Empty State Card

Used when no data exists.

Contains:

- Icon
- Title
- Helpful explanation
- Primary action

## 4. Visual style

Cards use:

```txt
Surface: white
Border: neutral-200
Radius: lg
Shadow: xs or none
Padding: 16px to 24px
```

Avoid heavy shadows.

## 5. Header

Card headers should be short.

Good:

```txt
Active subscriptions
```

Bad:

```txt
Here you can see all active subscriptions in the selected period
```

## 6. Actions

Card actions should be minimal.

Preferred:

- One primary contextual action
- Secondary actions inside menu when needed

## 7. Density

Cards should not become tables.

If a card needs many rows, use a table or detail panel.

## 8. KPI cards

KPI cards should show numbers with context.

Bad:

```txt
42
```

Good:

```txt
42 active subscriptions
+8 this month
```

## 9. Clickable cards

Clickable cards must have:

- Clear hover state
- Pointer cursor
- Accessible focus
- Consistent navigation behavior

Do not mix clickable card with many internal buttons unless necessary.

## 10. Acceptance criteria

A card is valid when:

- It groups related information.
- It supports a decision or action.
- It does not duplicate table behavior.
- It uses consistent spacing.
- It does not add decoration without purpose.

