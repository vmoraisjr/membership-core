# Task 003 - Dashboard Metrics

## Objective

Replace placeholder metrics with real operational metrics.

---

## Business Context

The dashboard should provide executive visibility.

---

## Requirements

Update:

features/dashboard

Create services:

* get-active-patients.ts
* get-active-subscriptions.ts
* get-monthly-revenue.ts
* get-benefit-consumption-metrics.ts

---

## Metrics

Display:

* Active Patients
* Active Subscriptions
* Monthly Revenue
* Annual Revenue
* Benefits Consumed
* Expiring Subscriptions

---

## UI

Reuse:

MetricCard

SectionCard

DashboardPage

Do not create new dashboard abstractions.

---

## Acceptance Criteria

All dashboard cards use real database data.
