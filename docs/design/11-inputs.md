# 11-inputs.md

# Sheep Inputs

## 1. Purpose

Inputs collect information with the least possible friction.

The user should always understand:

- What information is expected.
- Why it is needed.
- Whether the value is valid.
- How to fix it if invalid.

## 2. Principle

> Ask only what is necessary, when it is necessary.

## 3. Anatomy

A standard input may contain:

```txt
Label
Optional helper text
Input field
Validation message
```

## 4. Labels

Labels are mandatory for normal forms.

Avoid relying only on placeholder.

Good:

```txt
Phone
```

Bad:

```txt
Enter your phone here
```

## 5. Placeholder

Placeholder should show examples, not replace labels.

Good:

```txt
(11) 99999-9999
```

Bad:

```txt
Phone
```

## 6. Helper text

Use helper text when the field has rules.

Examples:

```txt
Use DDD + number.
```

```txt
The slug appears in the public URL. You can change it later.
```

## 7. Validation

Validation should be direct and useful.

Good:

```txt
Informe um telefone com DDD.
```

Bad:

```txt
Invalid value.
```

## 8. States

Every input must support:

```txt
default
hover
focus
filled
disabled
readonly
error
success
loading
```

## 9. Focus

Focus must be visible and accessible.

Use blue focus ring with soft opacity.

Do not remove focus outline without replacing it.

## 10. Required fields

Avoid excessive asterisks.

Preferred pattern:

- Mark optional fields as “Optional”.
- Treat unmarked fields as required only when context makes sense.

Example:

```txt
Slug Optional
```

## 11. Masks

Use masks for:

- Phone
- CEP
- CPF/CNPJ
- Currency
- Date

Masks should help, not block typing.

## 12. Field types

### Text

General short text.

### Textarea

Longer descriptions and notes.

### Select

Use when options are known and limited.

### Combobox

Use when options are searchable or many.

### Currency

Always format with locale.

### Phone

Validate DDD + number.

### CEP

Validate format and optionally auto-fill city/state/address.

### Password

Must include show/hide password action.

## 13. Password field

Login password label must be:

```txt
Senha
```

Not:

```txt
Nova Senha
```

Password fields must include:

- Show/hide password button.
- Accessible label.
- Keyboard support.

## 14. Error behavior

When a form fails:

- Keep all entered data.
- Show errors near fields.
- Show a calm summary only when needed.
- Focus the first field with error when appropriate.

## 15. Acceptance criteria

An input is valid when:

- Label is clear.
- Placeholder is not the only instruction.
- Error message helps fix the issue.
- Focus state is visible.
- It supports disabled and readonly.
- It follows masks when needed.
- It does not ask information already known by context.

