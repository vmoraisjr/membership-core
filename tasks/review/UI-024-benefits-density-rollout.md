# UI-024 - Benefícios e Uso de Benefícios: Marca Visual e Densidade — Relatório de Implementação

## Objetivo da task

Aplicar avatar/ícone colorido e botões de ação compactos às listagens de
Benefícios e de Uso de Benefícios.

## Arquivos modificados

- `features/membership-benefits/components/membership-benefits-table.tsx` —
  `CompanyAvatarMark` (seed = `benefit.id`) antes do título do benefício.
- `features/membership-benefits/components/membership-benefit-row-actions.tsx` —
  4 botões (`Pencil`, `XCircle`, `RotateCcw`, `Trash2`) migrados para
  `size="icon-sm"` + `variant="ghost"`; as duas ações destrutivas com
  texto/hover de perigo em vez de botão vermelho sólido.
- `features/benefit-usage/components/benefit-usage-table.tsx` —
  `CompanyAvatarMark` (seed = `usage.subscription.patientId`) antes do
  nome do paciente na primeira coluna. Este arquivo não tinha botões
  `size="icon"` a migrar — a única ação (cancelar uso) já usa um botão
  com texto, fora do escopo audiotado.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm test:membership` — ✅ 4 cenários (inclui consumo de benefício
  respeitando limites de uso).

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: mudança de apresentação, nenhuma server action alterada.

## Próxima task sugerida

`UI-025-subscriptions-density-rollout.md`.
