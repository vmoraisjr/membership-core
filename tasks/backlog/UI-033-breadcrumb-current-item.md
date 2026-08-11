# UI-033 - Breadcrumb: Item Atual Sem Estilo de Botão

## Objetivo da task

No breadcrumb do topo (ex. "Home / Empresas"), o item da página atual não
deve parecer um botão/chip — deve ser texto simples, igual ao "Home".

## Auditoria prévia (já feita)

`components/layout/breadcrumb-trail.tsx` — o crumb atual usa
`rounded-full border border-border/70 bg-background px-2.5 py-1
font-medium text-foreground`, visualmente indistinguível de um botão
outline pequeno. Componente compartilhado por todas as telas com
breadcrumb (21 telas usam `PageHeader`, o breadcrumb é renderizado em
`DashboardHeader`).

## Escopo

- Trocar o estilo do crumb atual (`crumb.isCurrent`) para texto simples
  (sem borda, sem fundo, sem padding de pill) — só peso de fonte
  diferenciando do link anterior, mantendo acessibilidade (ainda precisa
  ser identificável como "página atual", ex. via `aria-current="page"` já
  presente ou a adicionar).

## Critérios de aceite

- Breadcrumb inteiro lê como texto, não como fileira de botões, em
  qualquer tela.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.

## Restrições

- Mudança em componente compartilhado — validar visualmente em pelo menos
  3 telas diferentes antes de considerar concluída.
