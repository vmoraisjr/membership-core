# 14-tables.md

# Sheep Tables

## 1. Purpose

Tables help users scan, compare and act on structured data.

They should prioritize readability, filtering and contextual action.

## 2. Principle

> Tables are for decisions, not data dumping.

Every table should help the user answer a useful question.

## 3. Required features

Every main table should support:

- Search
- Filters
- Sorting where useful
- Pagination or infinite loading
- Loading state
- Empty state
- Error state
- Row action
- Bulk action when relevant
- Density mode when needed

## 4. Table anatomy

```txt
Table header area
  Title
  Description Optional
  Primary action
  Search
  Filters

Table
  Header
  Rows
  Row actions

Footer
  Pagination
  Density control Optional
```

## 5. Search

Search should be visible when the table has many records.

Placeholder examples:

```txt
Search customers
Search subscriptions
Search payments
```

## 6. Filters

Filters should be contextual.

Examples for customers:

```txt
Clinic
Status
Plan
Created period
```

Users section must include filter by clinic when multi-tenant context exists.

## 7. Row click behavior

Preferred behavior:

- Clicking row opens side panel.
- List remains visible.
- User preserves context.

## 8. Row actions

Use row actions for secondary operations.

Examples:

- Edit
- Duplicate
- Archive
- Delete

Avoid exposing too many actions directly in the row.

Use dropdown menu when more than two secondary actions exist.

## 9. Status badges

Use badges for status.

Examples:

```txt
Active
Pending
Canceled
Overdue
Invited
Inactive
```

Status colors must be semantic, not decorative.

## 10. Empty state

Bad:

```txt
No records found.
```

Good:

```txt
Nenhum cliente encontrado.
Ajuste os filtros ou cadastre um novo cliente para começar.
```

## 11. Loading state

Use skeleton rows.

Avoid large spinner in the center unless the whole table is unavailable.

## 12. Error state

Example:

```txt
Não foi possível carregar os clientes agora.
Tente novamente em alguns instantes.
```

Actions:

```txt
Try again
```

## 13. Density

Default:

```txt
comfortable
```

Optional:

```txt
compact
```

Compact should be user preference, not default.

## 14. Column rules

- First column should identify the record.
- Last column should contain actions.
- Avoid too many columns.
- Hide secondary data behind side panel.
- Use truncation with tooltip for long content.

## 15. Acceptance criteria

A Sheep table is valid when:

- It supports scan and action.
- It has search or filters when needed.
- Row click preserves context.
- Empty/loading/error states exist.
- Columns are not excessive.
- Main action is visible above table.

