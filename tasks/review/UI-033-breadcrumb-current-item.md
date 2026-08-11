# UI-033 - Breadcrumb: Item Atual Sem Estilo de Botão — Relatório de Implementação

## Objetivo da task

O item de página atual no breadcrumb não deve parecer um botão/chip.

## Arquivos modificados

- `components/layout/breadcrumb-trail.tsx` — item atual (`crumb.isCurrent`)
  trocado de `rounded-full border border-border/70 bg-background px-2.5
  py-1` para texto simples (`font-medium text-foreground`, sem borda/fundo/
  padding de pill), com `aria-current="page"` adicionado para
  acessibilidade (não existia antes). Link não-atual também ajustado
  (`rounded-full px-2.5 py-1 hover:bg-background` → `rounded-md px-0.5
  hover:text-foreground`) para ficar consistente como texto com leve
  affordance de link, não como botão.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.

## Trabalho remanescente

Nenhum — componente único, compartilhado por todas as 21 telas com
breadcrumb, corrigido de uma vez.

## Riscos

- Nenhum: mudança puramente visual em componente client-side sem lógica
  de negócio.

## Próxima task sugerida

`UI-034-dashboard-hero-and-usermenu.md`.
