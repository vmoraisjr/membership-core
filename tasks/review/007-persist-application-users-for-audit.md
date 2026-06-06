# Task 008 - Persist Application Users For Audit

## Objective

Persist real application users for precise audit actors.

---

## Business Context

Audit records should identify the exact user, not only the active role.

---

## Requirements

Create:

User model

User session linkage

Audit actor integration

---

## UI

No new management UI required.

---

## Acceptance Criteria

Every new audit record stores the real application user identity.
