# Task 001 - Benefit Usage Engine

## Objective

Implement the complete benefit consumption engine.

The system already contains:

* Membership Plans
* Membership Benefits
* Subscriptions
* BenefitUsage model

The goal is to allow a subscribed patient to consume benefits and create usage records.

---

## Business Context

A patient subscribes to a plan.

A plan contains benefits.

Benefits may have:

* usage limits
* monthly reset
* yearly reset
* unlimited usage

The system must validate whether the patient can consume the benefit.

---

## Requirements

### Backend

Create services:

features/benefit-usage/services

* validate-benefit-usage.ts
* get-benefit-usage-history.ts
* get-patient-benefit-balance.ts

Create actions:

features/benefit-usage/actions

* consume-benefit.ts

---

### Validation Rules

Validate:

* active subscription
* benefit belongs to plan
* usage limit not exceeded
* reset period respected

---

### Database

Create BenefitUsage records.

Do not modify existing Prisma models unless absolutely required.

---

### UI

Create:

BenefitUsageTable

Columns:

* Patient
* Benefit
* Date
* Quantity

Create:

BenefitUsageHistoryPage

---

## Acceptance Criteria

* Benefit can be consumed.
* Usage is persisted.
* Limits are enforced.
* History is visible.
* Invalid consumptions are blocked.
