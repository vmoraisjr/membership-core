# Design System Sheep

## Status

Fundação visual definitiva do SaaS (task `UI-001`). Direção: confiança, clareza, simplicidade, elegância, tecnologia discreta, sensação de vidro e alumínio, básico de grife — referências Notion, Stripe Dashboard e Volvo.

Este documento descreve os tokens e componentes que já existiam no projeto (a maior parte da fundação de tokens já estava implementada em `app/globals.css`, herdada de um trabalho anterior de "frontend design") e os componentes novos adicionados por esta task para fechar as lacunas apontadas em `docs/frontend-audit.md` (§2 e §6). Nenhum componente de negócio foi migrado para os novos primitivos nesta task — isso é escopo das tasks UI-002 em diante, tela por tela, conforme a ordem recomendada em `docs/frontend-audit.md`.

## Tokens

Todos os tokens vivem em `app/globals.css`, dentro de `:root` (e espelhados em `@theme inline` para o Tailwind v4). Não existem cores, espaçamentos, sombras ou raios soltos fora deste arquivo — qualquer novo valor visual deve ser adicionado aqui, nunca hardcoded em um componente.

### Cor

| Token | Uso |
|---|---|
| `--color-background`, `--color-foreground` | Fundo e texto base da aplicação |
| `--color-surface`, `--color-surface-muted`, `--color-surface-subtle` | Superfícies de cartão/painel em 3 níveis de destaque |
| `--color-border`, `--color-border-strong` | Bordas padrão e bordas de maior contraste |
| `--color-primary`, `--color-primary-hover`, `--color-primary-soft`, `--color-primary-foreground` | Cor de marca (ação primária, foco, links) |
| `--color-accent`, `--color-accent-soft` | Realce secundário (uso pontual) |
| `--color-success` / `-soft`, `--color-warning` / `-soft`, `--color-danger` / `-soft`, `--color-info` / `-soft` | Semântica de estado — única fonte de verdade para status em toda a aplicação (ver `StatusIndicator` abaixo) |

Todos os tokens shadcn padrão (`--background`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--sidebar*`) são derivados destes tokens de marca em vez de valores independentes — ver `app/globals.css:134-166`.

Modo escuro (`.dark`) existe no CSS mas **não está conectado a nenhum `ThemeProvider`** atualmente — não há alternância de tema na aplicação. Os tokens `.dark` permanecem como base para uma futura ativação, mas não são exercitados hoje e não fizeram parte do escopo desta task.

### Superfície, borda e sombra

- Radius: `--radius-xs` (0.25rem) até `--radius-xl` (1.25rem) + `--radius-full`. A maior parte dos componentes usa `rounded-xl`/`rounded-[1.25rem]` para uma sensação "arredondada, mas contida" (alumínio, não bolha).
- Sombra: `--shadow-xs` a `--shadow-lg` + `--shadow-focus` (anel de foco). Sombras são difusas e de baixo contraste — reforçam profundidade sutil (vidro) em vez de elevação dramática.

### Tipografia

- Fonte: `--font-sans` = "Atkinson Hyperlegible Next" com fallback para Inter/system — legibilidade alta, tom técnico-discreto.
- Escala: `--font-size-xs` (12px) a `--font-size-4xl` (36px), cada um com `--line-height-*` correspondente. Títulos de página usam `--font-size-3xl`/`--line-height-3xl` (`.workspace-title`); títulos de seção usam `--font-size-xl`/`--line-height-xl` (`.workspace-section-title`).

### Espaçamento

- `--space-1` (0.25rem) a `--space-16` (4rem) — escala usada nos utilitários de layout (`page-frame`, `page-section-grid`, etc. em `app/globals.css`).

### Estados

Todo componente interativo segue o mesmo contrato de estado, herdado de `Button`/`Input`:
- **default** — cor base do token.
- **hover** — `hover:bg-[...]`/`hover:text-...`, sempre um passo mais escuro/saturado que o default.
- **focus** — `focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15` (nunca `outline` do navegador).
- **active** — leve translação (`active:translate-y-px`) nos botões.
- **disabled** — `disabled:pointer-events-none disabled:opacity-50` (ou `disabled:bg-muted` em campos).
- **loading** — botões usam `disabled` + ícone `Loader2Icon` girando (`animate-spin`) já usado em `LoginForm`; não há uma variante `loading` própria no `Button` — o padrão do projeto é compor `disabled` + ícone, mantido nesta task por não exigir mudança de comportamento.
- **error** — `aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15`, dirigido pelo atributo `aria-invalid` (compatível com React Hook Form).

### Motion

- Durações: `--duration-instant` (0ms) a `--duration-slow` (240ms).
- Easing: `--ease-standard`, `--ease-out`, `--ease-in`, `--ease-emphasized`.
- Transições são deliberadamente curtas (120–240ms) — reforça "tecnologia discreta", sem animação chamativa.

### Breakpoints

Usa os breakpoints padrão do Tailwind v4 (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px). Não foram criados breakpoints customizados. `lg` é o ponto de corte estrutural do shell (`.app-shell` vira grid de duas colunas só a partir daí — ver observação de responsividade em `docs/frontend-audit.md` §4, a ser tratada na UI-002/UI-019).

## Componentes (`components/ui/*`)

### Já existentes (mantidos, sem alteração de API nesta task)

`Button`, `Input`, `Textarea`, `Select` (HTML nativo estilizado), `PasswordInput`, `Field`, `FormSection`, `Card`, `Table`, `Dialog`, `AlertDialog`, `SidePanel`, `DropdownMenu`, `Skeleton`, `Toaster` (sonner).

### Novos nesta task

| Componente | Arquivo | Observação |
|---|---|---|
| `Badge` | `components/ui/badge.tsx` | Variantes `default/secondary/success/warning/danger/info/outline`, construído sobre a classe utilitária `.status-badge` já existente em `globals.css`. |
| `StatusIndicator` | `components/ui/status-indicator.tsx` | Badge semântico com ponto de status (`tone`: success/warning/danger/info/neutral, `pulse` opcional). Substitui os helpers `getStatusClass`/`getStatusLabel` duplicados por feature (billing, subscriptions, clinic, users — ver `docs/frontend-audit.md` §3.11) — telas futuras devem adotar este componente em vez de reimplementar a lógica de cor por status. |
| `Checkbox` | `components/ui/checkbox.tsx` | Radix Checkbox restilizado. |
| `RadioGroup` / `RadioGroupItem` | `components/ui/radio-group.tsx` | Radix Radio Group restilizado. |
| `Switch` | `components/ui/switch.tsx` | Radix Switch restilizado. |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | `components/ui/tabs.tsx` | Radix Tabs restilizado. Uso futuro recomendado: `PlatformClinicDetailsPage` hoje implementa abas manualmente via `?tab=` com botões próprios (ver `docs/frontend-audit.md` §1.3) — a task UI-014 deve avaliar a migração para este primitivo. |
| `Tooltip` / `TooltipTrigger` / `TooltipContent` / `TooltipProvider` | `components/ui/tooltip.tsx` | Radix Tooltip restilizado. |
| `Pagination` (+ subcomponentes) | `components/ui/pagination.tsx` | Padrão shadcn de paginação, construído sobre `buttonVariants`. |
| `Breadcrumb` (+ subcomponentes) | `components/ui/breadcrumb.tsx` | Primitivo semântico de trilha de navegação. `components/layout/breadcrumb-trail.tsx` continua sendo a implementação específica do app (mapa de rótulos pt-BR) — é candidata a passar a usar este primitivo na UI-002, não migrada aqui para manter o escopo desta task restrito a fundação. |
| `Stepper` | `components/ui/stepper.tsx` | Composição própria (sem equivalente Radix) para fluxos multi-etapa — uso previsto em formulários com resumo antes de salvar (UI-008 planos, por exemplo). |
| `ErrorState` | `components/dashboard/error-state.tsx` | Espelha `EmptyState` (`components/dashboard/empty-state.tsx`) para padronizar estados de erro — colocado ao lado de `EmptyState` por ser exatamente o mesmo tipo de primitivo de página, não um primitivo de formulário/overlay como os de `components/ui`. |

### Já cobertos por composição existente (não recriados)

- **Drawer / Sheet**: `SidePanel` (`components/ui/side-panel.tsx`) já implementa esse padrão (painel lateral sobre `Dialog` do Radix). Não foi criado um componente `Sheet` paralelo — isso violaria o critério "sem biblioteca paralela ao shadcn/ui".
- **Toast**: `Toaster`/sonner já implementado e com ícones por tipo (`success/info/warning/error/loading`).
- **EmptyState**: já existia; documentado aqui para registro central.

## Critério: `Dialog` vs `SidePanel`

A auditoria (`docs/frontend-audit.md` §2) identificou que os dois padrões de overlay coexistem sem critério documentado. Critério fixado nesta task, a ser seguido pelas próximas tasks:

- **`Dialog`** — formulários de criação/edição de uma entidade em um único passo, ou confirmações. É o padrão para a maioria dos CRUDs (pacientes, planos, benefícios, assinaturas, uso de benefício).
- **`SidePanel`** — visualização detalhada de um registro com múltiplas seções (drill-down), ou formulários mais longos que se beneficiam de mais altura vertical (ex.: detalhes de clínica, detalhes de assinatura SaaS, detalhes de log de auditoria).

## Critério: adoção de `Select` e `DropdownMenu`

A auditoria encontrou 47 ocorrências de `<select>` HTML cru em 23 arquivos e nenhum uso de `DropdownMenu` para ações de linha. Esta task não migrou nenhuma tela (fora do escopo de "fundação"), mas fixa a regra: a partir da UI-002, todo novo filtro/campo de seleção deve usar `components/ui/select.tsx`, e toda tabela com mais de 2 ações por linha deve consolidar em `DropdownMenu` em vez de botões-ícone lado a lado.

## Regras permanentes herdadas

Nenhuma regra de negócio, rota, Server Action, isolamento de tenant, RBAC ou teste foi alterada por esta task. Nenhum componente de CRM, agenda ou comunicação foi tocado. Nenhum texto novo visível foi introduzido (os componentes desta task não têm texto fixo em português/inglês, exceto rótulos de acessibilidade `sr-only` como "Fechar" — mantidos consistentes com os já existentes em `dialog.tsx`/`side-panel.tsx`, que já usam textos fixos em inglês para esses `sr-only`; não expandido nem corrigido aqui por ser um padrão pré-existente fora do escopo desta task específica de fundação).
