# UI-037 - Tooltips Consistentes em Botões de Ação

## Objetivo da task

Garantir que todo botão de ação só-ícone (linhas de tabela, toolbars)
tenha tooltip explicando a ação ao passar o mouse, de forma consistente
entre telas.

## Auditoria prévia

A maioria dos botões de ícone já tem `title=`/`aria-label=` (mostra
tooltip nativo do navegador), padrão estabelecido nas tasks UI-022 a
UI-028. Precisa de uma varredura para achar os que ficaram de fora —
provavelmente concentrados em telas que não passaram pela Fase 2
(catálogo comercial, pagamentos SaaS, módulos, formulários com ícones
soltos).

## Escopo

- Grep por `<Button` com `size="icon"`/`"icon-sm"`/`"icon-xs"` sem
  `title=` correspondente, em todo `apps/web/features` (exceto CRM,
  Mensagens já cobertas, Contratos).
- Adicionar `title=`/`aria-label=` faltante, usando o mesmo texto do
  rótulo da ação (não inventar copy nova onde já existe uma chave i18n).
- Decidir se o tooltip nativo do navegador é suficiente ou se vale trocar
  por `components/ui/tooltip.tsx` (já existe, com animação) para um
  visual mais consistente com a marca — comparar as duas opções antes de
  escolher, documentar a decisão no relatório.

## Critérios de aceite

- Nenhum botão de ícone sem tooltip/aria-label em nenhuma tela dentro do
  escopo permitido.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.
