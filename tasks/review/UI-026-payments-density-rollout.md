# UI-026 - Pagamentos de Pacientes: Marca Visual — Relatório de Implementação

## Objetivo da task

Aplicar avatar colorido à listagem de pagamentos de pacientes. Os botões de
ação desta área já tinham sido migrados na Fase 1.

## Arquivos modificados

- `features/billing/components/patient-payments-table.tsx` —
  `CompanyAvatarMark` antes do nome do paciente (sem `seed` explícito: o
  tipo desta tabela só traz `patient.fullName`, não o `id` — o componente
  cai no fallback de usar o próprio nome como seed, o que já garante cor
  estável por paciente entre faturas diferentes). Coluna de valor
  (`formatCurrency`) ganhou `tabular-nums` para alinhamento de dígitos.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm test:billing` — ✅ 7 cenários.

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: mudança de apresentação, nenhuma server action alterada.

## Próxima task sugerida

`UI-027-users-density-rollout.md`.
