# UI-023 - Planos: Marca Visual e Densidade — Relatório de Implementação

## Objetivo da task

Aplicar o mesmo padrão de avatar colorido e botões de ação compactos à
listagem de Planos de associação.

## Arquivos modificados

- `features/membership-plans/components/membership-plans-table.tsx` —
  `CompanyAvatarMark` (iniciais do nome do plano + gradiente, seed = `plan.id`)
  adicionado antes do nome. Optei por manter o mesmo componente/critério
  visual das demais tabelas em vez de usar um ícone de status (ativo/
  inativo) — o status já tem seu próprio badge na coluna seguinte,
  duplicar o sinal no avatar seria redundante.
- `features/membership-plans/components/membership-plan-row-actions.tsx` —
  7 botões (`Eye`, `Pencil`, `Copy`, `Plus`, `XCircle`, `RotateCcw`,
  `Trash2`) migrados para `size="icon-sm"` + `variant="ghost"`; as duas
  ações destrutivas (`XCircle` desativar, `Trash2` excluir
  permanentemente) usam o texto/hover de perigo em vez de botão vermelho
  sólido, mesmo padrão das tasks anteriores.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm test:membership` — ✅ 4 cenários (inclui ciclo de vida de plano e
  cascata de desativação).

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: mudança de apresentação, nenhuma server action alterada.

## Próxima task sugerida

`UI-024-benefits-density-rollout.md`.
