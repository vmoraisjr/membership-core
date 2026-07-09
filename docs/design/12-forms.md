# 12-forms.md

# Sheep Forms

## 1. Purpose

Forms should help users complete a task quickly and safely.

A Sheep form is not a database table on screen. It is a guided interaction.

## 2. Principle

> Forms should feel shorter than they are.

This is achieved through grouping, defaults, progressive disclosure and contextual validation.

## 3. Structure

Recommended structure:

```txt
Page or panel title
Short description
Grouped fields
Contextual helper text
Actions
```

## 4. Field grouping

Group fields by meaning.

Example for clinic/business form:

```txt
Basic information
  Name
  Brand name
  Document

Contact
  Email
  Phone

Address
  CEP
  City
  State
  Address

Access
  Slug Optional
  Status
```

## 5. Primary action

A form should have one primary action.

Examples:

```txt
Create clinic
Save changes
Create plan
Send invite
```

Avoid:

```txt
Submit
OK
Confirm
```

## 6. Optional fields

Optional fields should be clearly marked.

Example:

```txt
Slug Optional
```

Do not make fields mandatory unless they are required to complete the business process.

## 7. Progressive disclosure

Advanced fields should be hidden or grouped.

Example:

```txt
Advanced settings
  Custom slug
  Internal notes
  Billing rules
```

## 8. Validation timing

Use validation:

- On blur for format fields.
- On submit for required fields.
- Immediately for fields with masks when useful.

Avoid aggressive validation while typing.

## 9. Save behavior

On save:

- Keep user in context.
- Show success feedback.
- Do not navigate away unless necessary.
- Preserve entered data if error occurs.

## 10. Create vs edit

Create forms may be more guided.

Edit forms should preserve context and avoid full-page disruption.

Prefer inline edit or panel edit where possible.

## 11. Long forms

For long forms, use sections instead of unnecessary steps.

Use stepper only when the sequence matters.

Good stepper examples:

- Onboarding
- Subscription setup
- Billing setup

Bad stepper examples:

- Simple customer creation
- Editing profile data

## 12. Form layout

Recommended widths:

```txt
Simple form: max 640px
Standard form: max 720px
Complex settings form: max 960px
```

## 13. Error summary

Use error summary only when:

- Form is long.
- Multiple errors occur.
- Errors are not visible above the fold.

## 14. Unsaved changes

If user tries to close a panel or leave page with unsaved changes:

Message:

```txt
Você tem alterações não salvas. Deseja sair mesmo assim?
```

Actions:

```txt
Continue editing
Discard changes
```

## 15. Acceptance criteria

A Sheep form is valid when:

- It asks only necessary fields.
- Fields are grouped by meaning.
- Main action is clear.
- Validation helps correction.
- Optional fields are marked.
- Data is preserved on error.
- Save behavior keeps context.

