# Entities

## Clinic

Represents a healthcare organization using the platform.

### Attributes
- id
- name
- brandName
- logoUrl
- slug
- document
- email
- phone
- zipCode
- city
- state
- address
- status
- createdAt

---

## Patient

Represents a subscribed patient/member.

### Attributes
- id
- clinicId
- fullName
- email
- phone
- birthDate
- document
- zipCode
- city
- state
- address
- status
- createdAt

---

## MembershipPlan

Represents a subscription plan created by a clinic.

### Attributes
- id
- clinicId
- name
- description
- monthlyPrice
- annualPrice
- active
- createdAt

---

## MembershipBenefit

Represents benefits included in a plan.

### Attributes
- id
- membershipPlanId
- type
- title
- description
- discountPercentage
- discountAmount
- usageLimit
- resetPeriod
- createdAt

---

## Subscription

Represents a patient's active membership.

### Attributes
- id
- patientId
- membershipPlanId
- status
- startedAt
- expiresAt
- canceledAt

---

## BenefitUsage

Tracks benefit consumption.

### Attributes
- id
- subscriptionId
- membershipBenefitId
- usedBy
- usedAt
- notes