# UI-050 — Fundação de Densidade Objetiva — Relatório de Implementação

## Objetivo

Reduzir peso visual dos primitivos compartilhados (títulos, cards de seção,
cards de métrica, espaçamento entre blocos) sem perder hierarquia,
legibilidade ou área de toque, e sem recriar telas individualmente.

## Auditoria

Medi os valores reais contra a escala-alvo da task em `app/globals.css` e
nos componentes `PageHeader`, `SectionCard`/`DataTableContainer`,
`MetricCard`:

| Elemento | Antes | Alvo | Depois |
|---|---|---|---|
| Título de página (`.workspace-title`) | 24px (`--font-size-3xl`) | ≤ 21px (`text-2xl`) | 21px (`--font-size-2xl`) |
| Título de seção (`.workspace-section-title`) | 18px (`--font-size-xl`) | 14–16px | 16px (`text-base`) |
| Cabeçalho de card (`.workspace-section-header`) | `py-4` (16px) | 12px | `py-3` (12px) |
| Espaço entre seções (`.page-frame`/`.page-section-grid`) | `gap-5 xl:gap-6` (20/24px) | 16–20px | `gap-5` (20px, sem escalar no xl) |
| Card de métrica (`.metric-tile-inner`) | `px-3 py-3 md:px-3.5` (12/12–14px) | 12–16px | Já conforme — sem mudança |
| Ícone do `MetricCard` | borda + `shadow-xs` (tratamento decorativo) | "sem área decorativa" | fundo semântico só, sem borda/sombra |
| Descrição do `MetricCard` (hint) | podia quebrar em 2 linhas | "descrição de uma linha" | `line-clamp-1` |

Também revisei `TableCell`/`TableHead` (`px-4 py-3`, já dentro de
12–16px), `.workspace-toolbar` (`px-4 py-3`, já conforme), `.field-stack`
(`gap-2` = 8px, já dentro de 8–12px) e os cabeçalhos de `SidePanel`
(`px-5 py-5`) — deixei estes últimos como estão: um painel lateral é mais
próximo de um cabeçalho de página (é o título de todo o fluxo que se abre)
do que de um cabeçalho de card, e é usado em praticamente todo diálogo do
app — mudar isso teria um raio de impacto muito maior do que o pedido
desta task justifica; registrado como candidato para uma rodada futura se
o usuário quiser.

## Arquivos modificados

- `app/globals.css` — `.workspace-title`, `.workspace-section-header`,
  `.workspace-section-title`, `.page-frame`, `.page-section-grid` (valores
  acima).
- `components/dashboard/metric-card.tsx` — `line-clamp-1` na descrição;
  ícone sem borda/sombra (`rounded-lg p-2`, mantendo só o fundo semântico
  por tom).
- `docs/design-system.md` — linha da seção "Tipografia" atualizada para
  refletir a nova escala de título de página/seção (estava documentando os
  valores antigos, 24px/18px).

## Fora do escopo (não alterado)

- Recriação de telas individuais — nenhum componente de página/feature foi
  tocado, só os primitivos compartilhados.
- `SidePanel`/`Dialog` headers — ver justificativa acima.
- Redução de fonte de corpo/controles (já estavam em `text-sm`/`text-xs`
  antes desta task) e touch targets (nenhum botão/alvo interativo teve
  tamanho reduzido).

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- Inspeção visual com Playwright (login real como Owner Operator, build de
  produção) em desktop (1440px) e mobile (390px) nas 6 áreas: Início,
  Empresas, workspace de empresa (detalhe), Planos comerciais, Chamados,
  Administração. Confirmado: hierarquia preservada (títulos ainda se
  distinguem claramente do corpo por peso/tamanho), sem quebra de layout,
  cards de métrica mais enxutos e com descrição em uma linha, sem
  necessidade de rolagem horizontal em mobile.

## Critérios de aceite

- ✅ Headers, cards, tabelas e formulários compartilham o mesmo ritmo
  compacto (todos passam pelos mesmos primitivos `.workspace-*`).
- ✅ Nenhuma tela perdeu hierarquia visual — confirmado nas capturas de
  tela (título > seção > corpo continuam distinguíveis).
- ✅ Classes reutilizáveis — nenhum valor de espaçamento/tipografia novo
  foi hardcoded fora de `globals.css`; o `MetricCard` usa apenas classes
  Tailwind padrão (`rounded-lg`, `p-2`) sem introduzir token novo.

## Riscos

- Baixo: mudanças são só em classes compartilhadas já centralizadas em
  `globals.css`/`MetricCard`; qualquer tela que usa `PageHeader`,
  `SectionCard`/`DataTableContainer` ou `MetricCard` (a maioria do app)
  herda o novo ritmo automaticamente, sem edição individual — exatamente o
  comportamento pretendido pela task.

## Próxima task

`UI-051-owner-sidebar-and-home-context.md` — seguindo em sequência,
conforme instrução do usuário de executar todas as tasks do backlog.
