# UI-037 - Tooltips Consistentes em Botões de Ação — Relatório de Implementação

## Objetivo da task

Garantir que todo botão de ação só-ícone tenha tooltip explicando a ação
ao passar o mouse.

## Auditoria (via subagent Explore)

Varredura em todo `apps/web/features/**` e `apps/web/components/**`
(exceto CRM, Contratos, Mensagens) por `Button` com `size="icon"`/`"icon-sm"`/
`"icon-xs"`/`"icon-lg"` sem `title=`/`aria-label=`. De 44 ocorrências,
**4 gaps reais**, todos os outros já tinham `title=`/`aria-label=`
consistentes (nenhuma divergência entre os dois encontrada):

- `features/clinic/components/clinic-row-actions.tsx` — botão "abrir no
  workspace" (`ExternalLink`) e botão "editar" (`Pencil`) sem tooltip.
- `components/ui/dialog.tsx` — botão de fechar usava só
  `<span className="sr-only">Close</span>` (em inglês), sem tooltip
  visível no hover.
- `components/ui/side-panel.tsx` — mesmo padrão, já em pt-BR
  ("Fechar painel") mas sem tooltip visível.

## Arquivos modificados

- `features/clinic/components/clinic-row-actions.tsx` — `title`/
  `aria-label` adicionados aos 2 botões.
- `components/ui/dialog.tsx` — `title="Fechar"` + `aria-label="Fechar"`
  adicionados ao botão de fechar; `<span className="sr-only">Close</span>`
  removido (texto em inglês e redundante — `aria-label` já define o nome
  acessível, o `sr-only` ficaria inalcançável para leitores de tela).
- `components/ui/side-panel.tsx` — `title="Fechar painel"` +
  `aria-label="Fechar painel"` adicionados; mesmo motivo de remoção do
  `sr-only` duplicado.

## Decisão arquitetural

- **Mantido o tooltip nativo do navegador (`title=`) em vez de migrar
  para o componente `Tooltip` (Radix) estilizado.** O padrão já é usado
  de forma consistente em ~40 botões no app inteiro; trocar exigiria
  envolver cada botão num `<Tooltip><TooltipTrigger>...` — refactor bem
  maior que o problema relatado (ausência de tooltip, não "tooltip feio").
  Fica registrado para a UI-040 reconsiderar se a densidade visual geral
  pedir um tooltip com cara de marca.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: só atributos de acessibilidade/tooltip adicionados.

## Próxima task sugerida

`UI-038-clinic-quickview-redesign.md`.
