# 15-side-panels.md

# Sheep Side Panels

## 1. Purpose

Side panels preserve context while showing details or allowing quick actions.

They are one of the signature interaction patterns of Sheep.

## 2. Principle

> The list should not disappear when the user is inspecting an item.

## 3. Use side panels for entities

Use for:

- Customer
- Subscription
- Plan
- Benefit
- Payment
- Charge
- User
- Invite

Do not use side panel for:

- Full analytics
- Complex settings
- Long onboarding
- Multi-step configuration
- Deep reports

## 4. Anatomy

```txt
Panel header
  Title
  Status
  Close action
  Optional primary action

Panel body
  Summary
  Tabs or sections
  Contextual data

Panel footer Optional
  Save/cancel actions
```

## 5. Width

Recommended widths:

```txt
sm: 420px
md: 560px
lg: 720px
xl: 860px
```

Default:

```txt
md or lg depending on entity complexity
```

## 6. Opening behavior

- Opens from right.
- Keeps table/list visible when possible.
- Does not reset filters.
- Does not scroll page unexpectedly.
- Supports escape key to close.

## 7. Editing behavior

Prefer edit inside the panel.

Flow:

```txt
View mode
Edit action
Editable fields inside same panel
Save
Return to view mode
```

Avoid opening modal from side panel unless absolutely necessary.

## 8. Tabs inside panels

Tabs are allowed for entity context.

Example customer panel:

```txt
Summary
Subscriptions
Benefits
Financial
History
Communication
```

Rules:

- Keep tab labels short.
- Avoid more than 6 tabs.
- Prioritize Summary first.

## 9. Nested panels

Avoid nested panels.

If user action needs another entity detail:

- Replace current panel content when context is close.
- Open full page when context is complex.
- Use breadcrumb inside panel only if necessary.

## 10. Close behavior

If no unsaved changes:

- Close immediately.

If unsaved changes exist:

Show confirmation:

```txt
Você tem alterações não salvas. Deseja sair mesmo assim?
```

## 11. Mobile behavior

On small screens, side panel becomes full-screen sheet.

Rules:

- Header remains sticky.
- Footer actions remain sticky when editing.
- Close action is visible.

## 12. Acceptance criteria

A side panel is valid when:

- It preserves user context.
- It supports view/edit flow.
- It has clear title and status.
- It avoids nested complexity.
- It handles unsaved changes.
- It works on mobile as full-screen sheet.

