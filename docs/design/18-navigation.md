# 18-navigation.md

# Sheep Navigation

## 1. Purpose

Navigation helps users move through Sheep without feeling lost.

## 2. Principle

> Navigation should be predictable, shallow and contextual.

## 3. Primary navigation

The primary navigation lives in the sidebar.

Top-level items:

```txt
Home
Operação
Relacionamento
Financeiro
Configurações
```

## 4. Menu depth

Avoid more than two levels.

Good:

```txt
Operação > Clientes
```

Bad:

```txt
Operação > Clientes > Ativos > Por plano > Detalhes
```

## 5. Active state

Current section must be visually clear.

Use:

- Soft blue background
- Blue text or icon
- Medium weight label

## 6. Breadcrumb

Use breadcrumb when the user is inside a nested context.

Example:

```txt
Home > Operação > Clientes > Maria Souza
```

## 7. Back button

Avoid relying on back button as primary navigation.

If layout and breadcrumb are clear, the user should rarely need it.

## 8. Global search future

Global search may become a major navigation tool.

It should search:

- Customers
- Subscriptions
- Plans
- Payments
- Users

## 9. Acceptance criteria

Navigation is valid when:

- User knows where they are.
- Main areas are predictable.
- There are no deep menu chains.
- Active state is visible.
- Breadcrumb exists in nested contexts.

