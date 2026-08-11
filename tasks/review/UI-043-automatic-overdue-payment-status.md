# UI-043 - Bug: Status de Pagamento "Atrasado" Deve Ser Automático — Relatório de Implementação

## Objetivo da task

Verificar se o status "atrasado" de uma fatura é automático por data ou
manual, e corrigir se for manual.

## Investigação

**Confirmado: é manual.** `markPatientInvoiceOverdueAction` e
`markClinicInvoiceOverdueAction`
(`features/billing/actions/mark-*-invoice-overdue.ts`) só rodam quando
alguém clica no botão correspondente — não existe cron/job no projeto, e
nenhuma leitura calcula "atrasado" a partir de `dueDate`. Confirmado
também em `platform-saas-payments-page.tsx`, onde encontrei esse botão
manual durante a UI-041.

## Tentativa de implementação e reversão

Criei `syncOverdueInvoices()` (rodando `updateMany` em
`PatientInvoice`/`ClinicInvoice` PENDING com `dueDate` vencido → OVERDUE)
e chamei no início de `getBillingOverview()`,
`getPlatformClinicBillingOverview()` e `getDashboardMetrics()` — mesmo
padrão de "reconciliação na leitura" já usado por
`reconcileClinicSubscriptionAutomation()` no mesmo arquivo.

**Isso quebrou `pnpm test:billing` e `pnpm test:tenant`** (2 suítes, 2
cenários). Causa raiz identificada antes de decidir o que fazer:

- `markClinicInvoiceOverdueAction` já existente não só marca a fatura
  como `OVERDUE` — ele chama `syncClinicSubscriptionStatusFromInvoice`
  **na mesma transação**, derivando o status da assinatura (`PAST_DUE`)
  imediatamente e de forma pontual (só para aquela fatura/assinatura).
- Meu `syncOverdueInvoices()` genérico só mexia no `PaymentStatus` da
  fatura, sem acionar essa mesma derivação de status de assinatura — uma
  fatura podia virar `OVERDUE` sem a assinatura correspondente virar
  `PAST_DUE` até a próxima varredura completa de
  `reconcileClinicSubscriptionAutomation()`.
- Pior: como meu sync roda em **toda** leitura de overview (dashboard,
  billing da clínica, billing de plataforma), e os testes de
  `tenant-isolation`/`billing` compartilham o mesmo banco entre cenários
  sequenciais, uma fatura de um fixture usado num cenário anterior virava
  `OVERDUE` "no automático" no meio de um cenário posterior que esperava
  controlar essa transição manualmente — alterando o estado de
  pré-condição que outro `runCase` já assumia como fixo.

Reverti a mudança por inteiro (removido
`features/billing/services/sync-overdue-invoices.ts` e as 3 chamadas) —
confirmado que `test:billing` e `test:tenant` voltam a passar 100% no
estado revertido.

## Recomendação para a próxima tentativa

A automação correta precisa reaproveitar
`syncClinicSubscriptionStatusFromInvoice` (ou uma versão em lote dela)
para cada fatura que muda de status, não só fazer `updateMany` na
fatura isoladamente — e precisa ser testada com a suíte completa de
billing/tenant rodando em sequência antes de ser considerada segura,
dado o compartilhamento de fixtures entre cenários. Vale abrir como task
nova e dedicada em vez de reaproveitar esta.

## Arquivos modificados

Nenhum no estado final (mudança implementada e revertida na mesma task).

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros (estado revertido).
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:billing` — ✅ 7 cenários (confirmando reversão limpa).
- `pnpm test:tenant` — ✅ 11 cenários (confirmando reversão limpa).

## Trabalho remanescente

Implementar a automação de verdade, coordenada com
`syncClinicSubscriptionStatusFromInvoice`, em task dedicada.

## Riscos

- Nenhum no estado atual (revertido). O risco documentado acima é para
  quem retomar a implementação.

## Próxima task sugerida

`UI-044-catalog-single-item-editable-bug.md`.
