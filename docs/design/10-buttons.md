# 10-buttons.md

# Sheep Buttons

## 1. Purpose

Buttons trigger actions. They should make the next step obvious without forcing the user to think.

A button in Sheep must answer three questions:

1. What will happen?
2. Is this the main action?
3. Is this action safe, secondary, or destructive?

## 2. Principle

> One primary action per context.

Every screen, panel, dialog or form should have at most one primary button visible in the same decision area.

## 3. Variants

### Primary

Use for the main action.

Examples:

- Save changes
- Create customer
- Create plan
- Send invite
- Confirm subscription

Visual:

- Blue background
- White text
- Medium weight
- Clear hover state

### Secondary

Use for supporting actions.

Examples:

- Cancel
- Back
- Duplicate
- Export
- View details

Visual:

- White or subtle surface background
- Neutral border
- Neutral text

### Ghost

Use for low-emphasis actions.

Examples:

- Clear filters
- Open options
- View history
- Dismiss

Visual:

- Transparent background
- Neutral text
- Hover with subtle background

### Destructive

Use for risky actions.

Examples:

- Delete customer
- Cancel subscription
- Remove user
- Revoke access

Visual:

- Red background only when the action is final and important
- Otherwise use red text on ghost/secondary variant

### Link

Use for inline navigation.

Examples:

- View invoice
- Open customer
- Learn more

Visual:

- Blue text
- No button container

## 4. Sizes

```txt
sm: 32px height
md: 40px height
lg: 48px height
```

Default size:

```txt
md
```

## 5. Icon usage

Buttons may include icons when they improve recognition.

Rules:

- Icon on the left for normal actions.
- Icon on the right for continuation actions.
- Do not use icons as decoration.
- Critical actions must include text.
- Icon-only buttons require tooltip and accessible label.

## 6. Loading state

When a button triggers async work:

- Disable repeated click.
- Show small spinner or loading indicator.
- Keep button width stable.
- Use verb in progress when helpful.

Examples:

```txt
Saving...
Sending...
Creating...
```

## 7. Disabled state

Disabled buttons should be used carefully.

When possible, prefer enabled button with validation guidance after click.

Use disabled when:

- Required context is clearly missing.
- User lacks permission.
- Action is temporarily unavailable.

## 8. Button placement

### Forms

Primary action on the right.
Secondary action on the left or before primary.

```txt
[Cancel] [Save changes]
```

### Side panels

Primary action in the panel footer or top-right, depending on flow.

### Tables

Primary page action appears above the table, top-right.

### Empty states

Primary action appears directly below the empty state message.

## 9. Copywriting

Use action verbs.

Good:

```txt
Create plan
Save changes
Send invite
Cancel subscription
```

Bad:

```txt
Submit
OK
Proceed
Confirm
```

## 10. Acceptance criteria

A Sheep button is valid when:

- Its action is clear.
- Its hierarchy is obvious.
- It has accessible focus state.
- It supports loading state.
- It uses the correct variant.
- It does not compete with another primary action.

