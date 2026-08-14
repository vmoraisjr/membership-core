# PAY-003 — Webhooks, renovação automática e controle de acesso — Relatório de Implementação

## Objetivo

Fazer a plataforma reagir de forma confiável aos eventos do provedor:
cobrar no fim do trial e a cada mês, registrar o resultado, liberar o
próximo mês somente quando pago, e restringir o uso apenas quando não
houver regularização dentro da tolerância.

## Endpoint

`POST /api/webhooks/billing`
(`app/api/webhooks/billing/route.ts`) — lê o corpo bruto antes de
qualquer parsing (necessário para a verificação de assinatura), espera
a assinatura no header `x-billing-webhook-signature`, e responde rápido
em toda etapa: assinatura inválida → 400 imediato, sem ler nada do
corpo além do necessário para rejeitar; evento já processado (mesmo
`externalEventId`) → 200 `{duplicate: true}` sem reprocessar; tenant
desconhecido → 200, grava o evento para observabilidade, não altera
nada.

## Idempotência

Novo modelo `BillingWebhookEvent` (`externalEventId` `@unique`, sem FK
para `Clinic` — um evento de tenant desconhecido precisa ser
registrável mesmo sem `clinicId` válido). Toda entrega processada marca
`processedAt`; uma redelivery encontra isso e não reprocessa. Eventos
fora de ordem não corrompem o estado porque cada handler relê o estado
**atual completo** da gateway (`getSubscription`) em vez de confiar no
payload do evento sozinho — o resultado reflete sempre a verdade mais
recente do provedor, não a ordem de chegada.

## Reconciliação de fatura e extensão de período

`recordSuccessfulGatewayPayment` (nova, em `billing-foundation.ts`):
quita a fatura do ciclo atual (cria uma se não existir — cobre o caso
"trial terminou e já tinha fatura pendente"), cria a fatura do próximo
ciclo, zera `paymentRetryCount`, e estende `expiresAt`. **Decisão de
design**: a extensão do período é ancorada na fatura recém-paga
(`dueDate + 1 mês`), não no campo de período da própria gateway —
descoberto durante os testes que a fake gateway não avança seu próprio
`currentPeriodEndsAt` sozinha (não simula um ciclo autônomo), o que
fazia "próximo período" colidir com a data da fatura recém-paga e
pular a criação da fatura seguinte. A gateway só é usada para
*adiantar* a data se ela relatar algo mais à frente do que o cálculo
local — nunca para regredir.

`recordFailedGatewayPayment` (nova): marca a fatura atual `OVERDUE`,
incrementa `paymentRetryCount`, calcula `nextPaymentAttemptAt`
espalhando as tentativas dentro de `BILLING_POLICY.paymentRetryToleranceDays`.
Não desliga o acesso — ver seção seguinte.

## Mudança de política: PAST_DUE agora opera (achado real durante a implementação)

Antes desta task, `canClinicOperate` só retornava `true` para
`ACTIVE`/`TRIAL` — ou seja, a primeira falha de cobrança **já
bloqueava o acesso imediatamente**, contradizendo o próprio critério
de aceite da PAY-003 ("restringe acesso *somente após* a tolerância
definida"). Corrigido: `PAST_DUE` agora também opera. A escalada real
para `SUSPENDED` (que bloqueia) continua acontecendo em
`deriveAutomatedClinicSubscriptionStatus`, agora usando
`BILLING_POLICY.paymentRetryToleranceDays` (constante da PAY-001) em
vez do `30` fixo que estava hardcoded ali — única fonte da verdade
para o prazo de tolerância.

Também corrigido: o fim do trial sem confirmação de pagamento **não
vira `ACTIVE` sozinho** para assinaturas vinculadas a gateway (fake ou
real) — vira `PAST_DUE`, iniciando o mesmo relógio de tolerância de uma
cobrança recusada (é exatamente isso, do ponto de vista de política:
tentou cobrar, não conseguiu). Assinaturas `MANUAL` (legadas,
administradas à mão) preservam o comportamento antigo — sem gateway,
sem cobrança automatizada, não há "tentativa" para verificar.

Essa mudança de política invalidou uma asserção existente em
`tests/tenant-isolation/cross-tenant-regression.test.ts` (a fixture
"Beta" é deliberadamente `PAST_DUE` e o teste esperava que seu módulo
Membership continuasse desabilitado) — corrigida para refletir a
política nova e correta (comentário explicando o porquê deixado no
teste).

## Tela de regularização

Já existia (`ClinicPlanActivationRequired`, usada por
`renderOperationalClinicScopedPage`) e continua funcionando sem
alteração de lógica — só passa a disparar de verdade apenas quando
justificado (`SUSPENDED`/`CANCELED`/`PENDING`), já que `PAST_DUE` não
aciona mais esse bloqueio. Confirmado ao vivo: uma empresa `PAST_DUE`
continua com a sidebar operacional inteira disponível.

## Reconciliação manual

`platformResyncClinicSubscriptionAction`
(`features/billing/actions/platform-resync-clinic-subscription.ts`) —
restrita a owner/admin de plataforma, consulta a gateway e aplica via
`syncClinicSubscriptionFromGateway` (mesma função que os webhooks
usam) — nunca edita o registro local diretamente. Se já estão em
sincronia, é um no-op sem auditoria nova. Botão/UI para acioná-la fica
para a PAY-004 (que já a lista como parte do seu próprio escopo).

## Runbook

`docs/billing-webhook-runbook.md` — configuração do endpoint, segredo
e rotação, tabela de eventos necessários (fake → equivalente típico em
provedor real), idempotência/reentrega, replay manual, reconciliação
manual, o que monitorar, e uma nota explícita de arquitetura: este
projeto não tem cron; a escalada `PAST_DUE → SUSPENDED` roda sob
demanda dentro de `reconcileClinicSubscriptionAutomation` (chamada por
`getBillingOverview()`), suficiente para o V1 mas documentado como
limitação conhecida.

## Migração Prisma

`20260812120000_billing_webhook_events` — 1 tabela nova
(`BillingWebhookEvent`, sem FK). Aplicada com o mesmo workaround
`migrate deploy` documentado nas PAY-001/002 (problema de shadow-database
pré-existente no ambiente, não introduzido por esta task).

## Arquivos criados

- `app/api/webhooks/billing/route.ts`
- `docs/billing-webhook-runbook.md`
- `features/billing/actions/platform-resync-clinic-subscription.ts`

## Arquivos modificados

- `prisma/schema.prisma` — modelo `BillingWebhookEvent`.
- `features/billing/services/billing-foundation.ts` — `canClinicOperate`
  (PAST_DUE opera), `deriveAutomatedClinicSubscriptionStatus` (tolerância
  parametrizada + trial-sem-pagamento vira PAST_DUE para assinaturas
  gateway-linked), `reconcileClinicSubscriptionAutomation` (exportada,
  já era usada por PAY-002), `recordSuccessfulGatewayPayment` e
  `recordFailedGatewayPayment` (novas).
- `tests/billing/billing-hardening.test.ts` — 2 casos novos (ciclo
  completo de webhook + resync manual).
- `tests/tenant-isolation/cross-tenant-regression.test.ts` — assertiva
  de contagem de módulo corrigida para a política nova (comentado o
  porquê).

## Fora do escopo (não alterado)

- Alterar catálogo/preço de planos no provedor.
- Cobrança de pacientes e meios de pagamento além de cartão.
- UI do owner para reconciliação/filtros — PAY-004.
- Cron/job agendado — documentado como limitação conhecida no runbook,
  não implementado (sem infraestrutura para isso no projeto hoje).

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, rota
  `/api/webhooks/billing` registrada.
- `pnpm test:billing` — ✅ 12 cenários (10 prévios + 2 novos: ciclo
  completo do webhook — assinatura inválida rejeitada, tenant
  desconhecido registrado sem alterar nada, pagamento aprovado
  reconcilia fatura/estende período, replay é no-op, pagamento recusado
  mantém operação dentro da tolerância e escala para SUSPENDED só
  depois dela — e resync manual).
- `pnpm test:tenant` — ✅ 11 cenários, 1 assertiva atualizada
  refletindo a política corrigida, sem regressão real.
- `pnpm test:rbac` — ✅ 5 cenários, sem regressão.
- `pnpm test:modules` — ✅ 4 cenários, sem regressão (confirma que a
  mudança de `canClinicOperate` não quebrou nenhuma regra de módulo V1
  existente).
- Verificação ao vivo contra build de produção via `fetch` real (não
  simulado em processo de teste): endpoint rodando, assinatura
  inválida → 400, `payment.failed` assinado → 200 e transição real
  TRIAL→PAST_DUE no banco, replay do mesmo evento → `duplicate: true`
  e `paymentRetryCount` inalterado.
- Playwright contra build de produção, ciclo completo real: criada
  empresa pelo formulário → webhook `payment.failed` real disparado via
  `fetch` contra o servidor rodando → confirmado no banco
  TRIAL→PAST_DUE → login como o master da empresa → confirmado que
  `/dashboard/patients` (página operacional) **permanece acessível**,
  sem cair na tela de regularização → aba Assinatura mostra "Pagamento
  pendente" com CTA "Atualizar cartão e regularizar" e toda a sidebar
  operacional intacta.

## Critérios de aceite

- ✅ Webhook válido de pagamento aprovado cria/atualiza uma única
  fatura e libera exatamente o próximo período; replay não muda o
  resultado — confirmado por teste e ao vivo.
- ✅ Cartão recusado mantém a assinatura fora de estado pago, orienta
  atualização de cartão (CTA já existente da PAY-002, ativo para
  PAST_DUE) e restringe acesso somente após a tolerância — confirmado
  ao vivo que o acesso **continua** logo após a primeira falha.
- ✅ Cancelamento/pausa recebido do provedor é refletido localmente
  preservando a data efetiva já comunicada — via
  `syncClinicSubscriptionFromGateway`, mesma função usada pela PAY-002.
- ✅ Webhooks inválidos, sem assinatura ou de tenant desconhecido não
  mudam nenhum dado e são observáveis sem registrar informação
  sensível — confirmado por teste e ao vivo (assinatura inválida:
  nenhuma linha criada; tenant desconhecido: linha criada com
  `error`, sem tocar em nenhuma assinatura real).

## Riscos

- Baixo-médio: a mudança de `canClinicOperate` (PAST_DUE opera) e do
  trial-sem-pagamento (vira PAST_DUE em vez de ACTIVE automático para
  assinaturas gateway-linked) são mudanças de comportamento real, não
  apenas internas — mitigadas por: alinhamento explícito com o critério
  de aceite da própria PAY-003, varredura completa dos testes
  existentes (só uma asserção precisou de atualização, e por um motivo
  já documentado), e confirmação ao vivo do fluxo completo.
- Baixo: ausência de cron para escalar `PAST_DUE → SUSPENDED`
  automaticamente sem interação — documentado no runbook como
  limitação conhecida do V1, não uma lacuna silenciosa.

## Próxima task

`PAY-004-owner-billing-operations.md` — seguindo em sequência.
