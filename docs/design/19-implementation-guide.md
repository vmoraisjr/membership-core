# 19-implementation-guide.md

# Sheep Implementation Guide

## 1. Purpose

This document translates design decisions into implementation rules for React, Tailwind, Shadcn and the Sheep codebase.

## 2. Source of truth

The source of truth should be:

```txt
Design tokens
React components
Storybook or component previews
Documentation
```

Figma is optional and should not become the only source of truth.

## 3. Component location

Recommended structure:

```txt
packages/ui
  components
    button
    input
    card
    table
    side-panel
    page-header
    feedback
  tokens
  utils
```

If the project is not yet using `packages/ui`, start inside the app and migrate later.

```txt
apps/web/src/components/ui
apps/web/src/components/sheep
```

## 4. Naming

Component names must be in English.

Examples:

```tsx
<Button />
<Input />
<Card />
<DataTable />
<SidePanel />
<PageHeader />
<StatusBadge />
```

Product copy remains translated through i18n.

## 5. Tailwind theme

Map tokens into Tailwind theme.

Recommended names:

```txt
background
foreground
surface
muted
border
primary
accent
success
warning
danger
info
```

## 6. Shadcn strategy

Use Shadcn as foundation, not as final design language.

Rules:

- Keep accessibility from Radix/Shadcn.
- Replace visual defaults with Sheep tokens.
- Do not import random component styles.
- Normalize spacing, radius and typography.

## 7. Component API

Components should expose intent, not raw styling.

Good:

```tsx
<Button variant="primary" size="md" loading>
  Save changes
</Button>
```

Bad:

```tsx
<Button className="bg-blue-600 px-4 rounded-xl shadow-md">
  Save
</Button>
```

## 8. Avoid className abuse

`className` is allowed, but should not be the main customization strategy.

If the same override appears twice, create a variant or component.

## 9. Accessibility defaults

Every component must include:

- Keyboard support
- Visible focus
- ARIA when needed
- Correct semantic HTML
- Reduced motion support when animated

## 10. Testing priority

Initial testing should cover:

- Button states
- Input validation states
- Form submission behavior
- Side panel open/close
- Table loading/empty/error states
- Keyboard navigation

## 11. Refactoring rule

When improving a screen:

1. Identify reusable patterns.
2. Create or update component.
3. Apply component to screen.
4. Document the rule.

Do not fix visual issues with one-off CSS unless temporary and documented.

## 12. First implementation order

```txt
1. CSS variables
2. Tailwind theme
3. Button
4. Input
5. Card
6. PageHeader
7. Sidebar
8. DataTable
9. SidePanel
10. Feedback components
```

## 13. Acceptance criteria

Implementation is valid when:

- It uses tokens.
- It avoids one-off styling.
- It supports accessibility.
- It can be reused.
- It follows Sheep principles.

