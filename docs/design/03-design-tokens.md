# Sheep Design Tokens

## 1. Filosofia dos tokens

Os tokens são a base visual e técnica do Sheep.

Eles devem garantir:

- Consistência
- Escalabilidade
- Temas futuros
- Facilidade de manutenção
- Integração com Tailwind
- Integração com Shadcn
- Evolução para white-label

## 2. Organização recomendada

```txt
tokens
  colors
  typography
  spacing
  radius
  shadow
  motion
  z-index
```

## 3. Tokens primitivos

Tokens primitivos representam valores brutos.

Exemplo:

```txt
blue-50
blue-100
blue-500
neutral-900
space-4
radius-md
duration-fast
```

## 4. Tokens semânticos

Tokens semânticos representam intenção.

Exemplo:

```txt
background
foreground
surface
surface-muted
border
primary
success
warning
danger
info
```

A interface deve usar tokens semânticos sempre que possível.

## 5. Nomes recomendados

### Cores

```txt
--color-background
--color-foreground
--color-surface
--color-surface-muted
--color-border
--color-border-strong
--color-primary
--color-primary-hover
--color-primary-foreground
--color-success
--color-warning
--color-danger
--color-info
```

### Espaçamento

```txt
--space-1
--space-2
--space-3
--space-4
--space-5
--space-6
--space-8
--space-10
--space-12
--space-16
```

### Radius

```txt
--radius-xs
--radius-sm
--radius-md
--radius-lg
--radius-xl
--radius-full
```

### Sombras

```txt
--shadow-xs
--shadow-sm
--shadow-md
--shadow-lg
--shadow-focus
```

### Motion

```txt
--duration-instant
--duration-fast
--duration-normal
--duration-slow

--ease-standard
--ease-out
--ease-in
--ease-emphasized
```

## 6. Base CSS inicial

```css
:root {
  --color-background: #f8fafc;
  --color-foreground: #111827;

  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-surface-subtle: #f8fafc;

  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-soft: #dbeafe;
  --color-primary-foreground: #ffffff;

  --color-accent: #7c3aed;
  --color-accent-soft: #ede9fe;

  --color-success: #16a34a;
  --color-success-soft: #dcfce7;

  --color-warning: #d97706;
  --color-warning-soft: #fef3c7;

  --color-danger: #dc2626;
  --color-danger-soft: #fee2e2;

  --color-info: #0284c7;
  --color-info-soft: #e0f2fe;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 999px;

  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 16px 40px rgba(15, 23, 42, 0.12);
  --shadow-focus: 0 0 0 4px rgba(37, 99, 235, 0.16);

  --duration-instant: 0ms;
  --duration-fast: 120ms;
  --duration-normal: 180ms;
  --duration-slow: 240ms;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
}
```

## 7. Dark mode futuro

O tema padrão do Sheep é Light.

Dark mode deve existir, mas não é prioridade da v1.

Regra:

- Light é o padrão.
- Dark é opcional.
- Tokens precisam estar preparados para ambos.
