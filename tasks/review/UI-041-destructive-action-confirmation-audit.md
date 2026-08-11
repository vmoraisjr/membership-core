# UI-041 - Auditoria de Confirmação em Ações Destrutivas — Relatório de Implementação

## Objetivo da task

Garantir que toda ação destrutiva/irreversível peça confirmação antes de
executar.

## Auditoria (via subagent Explore)

Varredura em `apps/web/features/**` (exceto CRM, Contratos, Mensagens)
por `<form action={...}>` com `<Button type="submit">` sem
`ConfirmDialog`/`ConfirmSubmitButton`. 2 arquivos com gap real:

- `features/billing/components/platform-saas-subscriptions-page.tsx` —
  as 4 transições de status de assinatura SaaS (marcar ativa, enviar
  para trial, suspender, **cancelar**) eram `<form><Button
  type="submit">` direto. Confirmado como a causa mais provável do
  cancelamento acidental relatado no QA.
- `features/billing/components/platform-saas-payments-page.tsx` —
  "marcar como paga" e "marcar como atrasada" (fatura SaaS) também sem
  confirmação.

Tudo o mais já auditado nas tasks anteriores (módulos, usuários,
pacientes, planos, benefícios, assinaturas de clínica, faturas de
paciente) já usa `ConfirmDialog`/`ConfirmSubmitButton` consistentemente.

## Arquivos modificados

- `components/dashboard/confirm-submit-button.tsx` — componente
  compartilhado ganhou 3 props opcionais (`size`, `icon`, `tooltip`) para
  suportar o padrão de botão só-ícone usado nas tabelas de billing, sem
  quebrar o uso existente em `modules-page.tsx` (que passa `label` com
  texto e não usa os novos props — comportamento idêntico ao anterior
  quando omitidos).
- `features/billing/components/platform-saas-subscriptions-page.tsx` —
  as 4 ações de transição de status agora passam por
  `ConfirmSubmitButton`, com descrição citando o nome da empresa e o
  status de destino.
- `features/billing/components/platform-saas-payments-page.tsx` — as 2
  ações de fatura (marcar paga/atrasada) idem.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:billing` — ✅ 7 cenários.
- `pnpm test:modules` — ✅ 4 cenários (garante que a extensão do
  `ConfirmSubmitButton` não quebrou o uso existente).
- `pnpm test:users` — ✅ 4 cenários.

## Trabalho remanescente

Nenhum gap de confirmação identificado. Observação lateral: a ação
"marcar fatura como atrasada" em `platform-saas-payments-page.tsx` é
manual — relacionado ao que a UI-043 vai investigar (se o status
atrasado deveria ser automático por data).

## Riscos

- Nenhum: `ConfirmSubmitButton` manteve retrocompatibilidade total (todas
  as props novas são opcionais, testado via `test:modules`).

## Próxima task sugerida

`UI-042-plan-change-flow-redesign.md`.
