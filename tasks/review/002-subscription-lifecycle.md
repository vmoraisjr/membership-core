# Task 002 - Subscription Lifecycle Engine

## Objective

Implement the full lifecycle of subscriptions.

Current statuses already exist.

The system must automate lifecycle transitions.

---

## Business Context

Subscriptions should evolve through:

ACTIVE

PAUSED

OVERDUE

CANCELED

EXPIRED

---

## Requirements

Create actions:

features/subscriptions/actions

* pause-subscription.ts
* resume-subscription.ts
* expire-subscription.ts
* renew-subscription.ts

Create services:

features/subscriptions/services

* evaluate-subscription-status.ts
* get-expiring-subscriptions.ts

---

## Lifecycle Rules

Pause

* subscription remains linked
* benefits unavailable

Resume

* returns to ACTIVE

Expire

* benefits unavailable

Renew

* extends expiration date

Cancel

* retains history

Never hard delete subscriptions.

---

## UI

Add lifecycle actions to:

SubscriptionRowActions

Add status badges.

---

## Acceptance Criteria

* Lifecycle actions work.
* Status transitions are validated.
* History remains intact.
* No hard deletion.
