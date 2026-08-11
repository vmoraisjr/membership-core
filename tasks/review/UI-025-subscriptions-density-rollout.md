# UI-025 - Assinaturas (Clínica): Marca Visual e Densidade — Relatório de Implementação

## Objetivo da task

Aplicar avatar colorido e botões de ação compactos à listagem de
Assinaturas no nível da clínica.

## Auditoria prévia

Confirmado ao editar: `features/subscriptions` não tem nenhum `MetricCard`
— a tela não tem cards de métrica, então o item "conferir se os cards de
métrica já usam `tone`" do escopo original não se aplica.

## Arquivos modificados

- `features/subscriptions/components/subscriptions-table.tsx` —
  `CompanyAvatarMark` (seed = `subscription.patientId`) antes do nome do
  paciente.
- `features/subscriptions/components/subscription-row-actions.tsx` — 6
  botões (`Pencil`, `Pause`, `Clock3`, `Play`, `RefreshCw`, `XCircle`)
  migrados para `size="icon-sm"` + `variant="ghost"`; a ação destrutiva
  (`XCircle` cancelar) com texto/hover de perigo em vez de botão vermelho
  sólido.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm test:membership` — ✅ 4 cenários (inclui ciclo de vida de assinatura).

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: mudança de apresentação, nenhuma server action alterada.

## Próxima task sugerida

`UI-026-payments-density-rollout.md`.
