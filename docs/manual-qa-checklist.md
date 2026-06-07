# Manual QA Checklist

## Test Accounts

Prepare at minimum:

- one clinic owner
- one clinic admin
- one clinic staff user
- one clinic finance user
- one second clinic for tenant-isolation spot checks

## Authentication

1. Open `/login` and authenticate with a valid owner user.
2. Confirm invalid credentials are rejected.
3. Confirm an inactive user cannot authenticate.
4. If invite flow is enabled for the environment, confirm a pending invite can be accepted once and not reused.
5. Confirm forgot-password and reset-password pages load without runtime errors.

## Dashboard

1. Confirm clinic dashboard metrics load.
2. Confirm metrics are clinic-scoped and do not include another clinic's data.
3. If a workspace-level platform operator exists in the environment, confirm platform metrics render only in that context.

## Patients and Membership

1. Create a patient.
2. Edit the patient.
3. Deactivate and reactivate the patient if the workflow is available.
4. Create an active plan and benefit.
5. Create a subscription for the patient.
6. Confirm the subscription creates expected dependent records.
7. Cancel the subscription and confirm historical records remain visible.

## Benefit Usage

1. Consume a valid benefit.
2. Confirm usage limits are enforced.
3. Confirm inactive benefits cannot be consumed.
4. Confirm canceled or expired subscriptions cannot consume benefits.

## Patient Billing

1. Open billing as owner or finance.
2. Confirm patient invoices are visible only for the current clinic.
3. Mark a pending patient invoice as overdue.
4. Mark an overdue patient invoice as paid.
5. Confirm duplicate payment rows are not created by repeated submissions.
6. Confirm staff users cannot perform billing mutations.

## SaaS Billing

1. Confirm the clinic SaaS subscription status is visible.
2. Mark a clinic invoice as overdue and confirm the SaaS status becomes `PAST_DUE`.
3. Mark the clinic invoice as paid and confirm the SaaS status becomes `ACTIVE`.
4. Suspend the clinic SaaS subscription manually.
5. Reactivate the clinic SaaS subscription manually.
6. Cancel the clinic SaaS subscription manually.
7. Confirm a canceled SaaS subscription stays visible for history and is not auto-recreated.

## Contracts

1. Open contracts as owner or finance.
2. Create or edit a patient contract template.
3. Activate or deactivate a clinic-owned contract template.
4. Confirm a patient contract can move through its allowed lifecycle.
5. Confirm patient acceptance is recorded once and remains idempotent.
6. Confirm clinic contract records remain scoped to the current clinic.

## Users and RBAC

1. Invite a new user.
2. Confirm invite lifecycle states render correctly.
3. Change a user's role.
4. Deactivate and reactivate a user.
5. Revoke an invite.
6. Confirm the last active owner cannot be removed, demoted or deactivated.
7. Confirm staff and read-only roles remain blocked from protected actions.

## Modules

1. Open the modules page.
2. Confirm Membership is active.
3. Confirm CRM, Scheduling and Communication stay dormant or disabled.
4. Confirm staff cannot manage module state.

## Audit Log

1. Open the audit log.
2. Confirm recent actions appear for invite, role change, billing and contracts.
3. Confirm audit data is clinic-scoped.
4. Confirm log filters do not crash when used with real data.

## Final Sign-Off

1. Record any failed step with the affected role, clinic and page.
2. Record any manual workaround required during QA.
3. Do not approve pilot release if tenant scope, billing integrity or authentication checks fail.
