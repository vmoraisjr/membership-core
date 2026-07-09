# 16-feedback.md

# Sheep Feedback

## 1. Purpose

Feedback tells the user what happened, what is happening, or what needs attention.

Feedback should reduce uncertainty.

## 2. Principle

> Feedback must be calm, specific and useful.

## 3. Feedback types

```txt
Toast
Inline message
Alert
Empty state
Loading state
Validation message
Confirmation dialog
Status badge
```

## 4. Toasts

Use toast for lightweight feedback after actions.

Examples:

```txt
Alterações salvas.
Convite enviado.
Plano criado.
Assinatura cancelada.
```

Error toast:

```txt
Não foi possível enviar o convite. Tente novamente.
```

Rules:

- Keep short.
- Do not stack too many.
- Do not use for field validation.
- Do not use for critical decisions.

## 5. Inline messages

Use inline messages near the relevant area.

Good for:

- Form errors
- Field helper text
- Local warnings
- Section-level issues

## 6. Alerts

Use alerts for important contextual messages.

Types:

```txt
info
success
warning
danger
```

Alert copy should answer:

- What happened?
- Why does it matter?
- What should the user do?

## 7. Loading states

Prefer skeletons over generic spinners.

Use:

- Skeleton table rows
- Skeleton card blocks
- Button loading state
- Inline loading for small actions

Avoid blocking whole screen unless necessary.

## 8. Empty states

Empty states must guide action.

Structure:

```txt
Icon
Title
Short explanation
Primary action Optional
Secondary action Optional
```

Example:

```txt
Nenhum plano cadastrado ainda.
Crie o primeiro plano para começar a vender assinaturas.
[ Criar plano ]
```

## 9. Error states

Error messages should not blame the user.

Good:

```txt
Não foi possível carregar os clientes agora.
Tente novamente em alguns instantes.
```

Bad:

```txt
Erro ao executar query.
```

## 10. Success states

Success should be calm.

Avoid celebration unless the flow is meaningful.

Good:

```txt
Assinatura criada.
```

Avoid:

```txt
Parabéns! Você acaba de criar uma assinatura incrível!
```

## 11. Confirmation dialogs

Use only for:

- Destructive actions
- Irreversible actions
- Actions with financial impact
- Leaving unsaved changes

Dialog copy:

```txt
Cancel subscription?
This customer will lose access to active benefits at the end of the current period.
```

Actions:

```txt
Keep subscription
Cancel subscription
```

## 12. Status badges

Badges should be short and semantic.

Examples:

```txt
Active
Pending
Overdue
Canceled
Inactive
Draft
Invited
```

Avoid long badge text.

## 13. Acceptance criteria

Feedback is valid when:

- It is specific.
- It is calm.
- It helps the user continue.
- It appears near the relevant context.
- It does not overuse alerts or modals.

