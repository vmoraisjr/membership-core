# Runbook — Cobrança recorrente: webhook e operação (PAY-003 + PAY-004)

## Estado atual

Nenhum provedor de pagamento real está contratado (decisão registrada
em `tasks/review/PAY-001-provider-and-billing-foundation.md`). O
gateway ativo é `FakeBillingGateway`
(`features/billing/gateway/fake-billing-gateway.ts`) — determinístico,
em memória, sem chamada de rede. Este runbook descreve tanto o
comportamento atual (fake) quanto o que precisa ser configurado quando
um provedor real for contratado.

## Endpoint

`POST /api/webhooks/billing` — `app/api/webhooks/billing/route.ts`.

- Lê o corpo bruto (`request.text()`) antes de qualquer parsing —
  necessário porque a verificação de assinatura precisa dos bytes
  exatos enviados pelo provedor, não de um JSON re-serializado.
- Espera a assinatura no header `x-billing-webhook-signature`.
- Responde rápido: verifica assinatura → confere idempotência →
  processa → responde. Nenhuma etapa faz chamada de rede lenta além de
  uma consulta ao gateway (`getSubscription`) quando necessário para
  buscar o estado atual antes de aplicar.

## Segredo do webhook

- Fake: variável de ambiente `FAKE_BILLING_WEBHOOK_SECRET` (tem
  default de desenvolvimento se não definida — **nunca usar esse
  default fora de ambiente local**). Usado para assinar/verificar via
  HMAC-SHA256 (`signFakeWebhookPayload` em `fake-billing-gateway.ts`).
- Real (quando contratado): o provedor gera um segredo por endpoint
  cadastrado no painel dele. Guardar em variável de ambiente própria
  (nunca no código, nunca em log) e implementar
  `verifyWebhookSignature` no adaptador real seguindo o esquema de
  assinatura documentado pelo provedor (geralmente HMAC sobre
  timestamp+corpo, com tolerância de replay de alguns minutos).
- **Rotação de segredo**: gerar o novo segredo no provedor, atualizar a
  variável de ambiente em produção, fazer deploy, só então revogar o
  segredo antigo no painel do provedor — nessa ordem, para não haver
  janela sem segredo válido. Cada implementação de `BillingGateway`
  deve suportar aceitar 2 segredos simultaneamente durante a janela de
  rotação se o provedor não fizer isso automaticamente.

## Eventos necessários (mínimo)

| Evento (fake) | Equivalente típico em provedor real | Efeito local |
|---|---|---|
| `invoice.paid` / `payment.succeeded` | `invoice.payment_succeeded`, `charge.succeeded` | `recordSuccessfulGatewayPayment` — quita a fatura atual, cria a próxima, estende `expiresAt`, zera tentativas, status `ACTIVE`. |
| `invoice.payment_failed` / `payment.failed` | `invoice.payment_failed` | `recordFailedGatewayPayment` — marca fatura `OVERDUE`, incrementa `paymentRetryCount`, status `PAST_DUE` (acesso continua). |
| `subscription.paused` | evento de pausa do provedor (nem todo provedor tem; pode ser só o retorno síncrono da chamada de pausa) | `syncClinicSubscriptionFromGateway` → `PAUSED`. |
| `subscription.resumed` | idem, para retomada | → `ACTIVE`. |
| `subscription.canceled` | `customer.subscription.deleted` | → `CANCELED`, preserva `canceledAt`. |
| `customer.updated` | `customer.updated`/`payment_method.attached` | apenas resincroniza estado, sem mudança de fatura. |

Qualquer evento fora dessa lista é aceito (200) e registrado em
`BillingWebhookEvent`, mas não aciona nenhuma lógica — evita que um
tipo de evento novo do provedor quebre o endpoint.

## Idempotência e reentrega

- `BillingWebhookEvent.externalEventId` é `@unique`. Antes de processar,
  o endpoint confere se já existe um registro com `processedAt`
  preenchido — se sim, responde `200 { duplicate: true }` sem tocar em
  nada.
- Eventos fora de ordem (ex.: `payment_failed` chega depois de
  `payment_succeeded` para o mesmo ciclo) não corrompem o estado porque
  cada handler sempre pergunta à gateway o estado **atual** completo
  (`getSubscription`) em vez de confiar apenas no payload do evento —
  o resultado final reflete a verdade mais recente do provedor, não a
  ordem de chegada dos webhooks.
- Evento para um `externalSubscriptionId` desconhecido (tenant não
  encontrado) é gravado com `error: "unknown_subscription"` e
  `processedAt` preenchido, sem alterar nenhum dado — observável via
  consulta direta à tabela `BillingWebhookEvent`, sem endpoint de
  listagem por enquanto (fica para quando houver operação real do
  provedor).

## Replay manual

Para reprocessar um evento perdido: apagar a linha correspondente em
`BillingWebhookEvent` (ou zerar `processedAt`) e reenviar a entrega
pelo painel do provedor (a maioria oferece "resend"/"replay" nativo).
Nunca reconstruir o payload manualmente para um provedor real — a
assinatura não vai bater.

## Reconciliação manual

`platformResyncClinicSubscriptionAction`
(`features/billing/actions/platform-resync-clinic-subscription.ts`) —
ação restrita a owner/admin de plataforma, consulta
`gateway.getSubscription()` e aplica via
`syncClinicSubscriptionFromGateway` (mesma função que os webhooks
usam) — nunca edita o registro local diretamente. Se local e gateway já
concordam, é um no-op sem auditoria nova. Usada pela visão operacional
do owner (PAY-004) quando uma divergência é suspeitada.

## Monitoramento (o que observar quando houver provedor real)

- Taxa de `error` não nulo em `BillingWebhookEvent` — sinal de eventos
  chegando com tipo/payload inesperado ou falha ao aplicar.
- Latência de resposta do endpoint — deve ficar bem abaixo do timeout
  que o provedor aplica antes de considerar a entrega falha e tentar de
  novo.
- Assinaturas com `syncStatus` diferente de `SYNCED` por mais que
  alguns minutos — indica webhook não chegou ou falhou silenciosamente.
- Assinaturas `PAST_DUE` há mais tempo que
  `BILLING_POLICY.paymentRetryToleranceDays` sem terem virado
  `SUSPENDED` — sinal de que a reconciliação automática (que roda sob
  demanda, ver abaixo) não está sendo exercitada porque a empresa
  parou de acessar a plataforma.

## Nota de arquitetura: sem cron

Este projeto não tem infraestrutura de job agendado. A escalada
automática `PAST_DUE → SUSPENDED` depois da janela de tolerância
acontece dentro de `reconcileClinicSubscriptionAutomation`, chamada
sob demanda a cada `getBillingOverview()` (ex.: toda vez que a empresa
ou a plataforma abre uma tela de cobrança). Isso é suficiente para o
V1 porque o próprio ato de a empresa tentar operar já dispara a
checagem — mas significa que uma empresa que simplesmente parou de
acessar o sistema não é escalada até alguém (ela mesma ou a
plataforma) abrir uma tela que chame essa função. Se isso se tornar um
problema real, a solução é um cron chamando
`reconcileClinicSubscriptionAutomation()` periodicamente — function já
pronta para isso, só falta o agendador.

---

## Operação do owner (PAY-004)

### Permissões

Toda ação de cobrança de plataforma (sincronizar, verificar
divergência, gerar link de pagamento, registrar nota de suporte,
transições manuais de status para assinaturas `MANUAL`) exige
`assertPermission("clinic", "manage")` **e** que o usuário logado seja
`OWNER`/`ADMIN` sem `clinicId` (owner da plataforma, não de uma
empresa) — mesma guarda (`assertPlatformOwner`) replicada em cada
action, sem sistema de permissão paralelo. Nenhuma dessas actions
aceita um `clinicId` vindo do formulário: o alvo é sempre resolvido a
partir do `subscriptionId`/`invoiceId`, e a própria consulta ao banco é
quem amarra isso à empresa certa.

### Por que o owner não pode mais "marcar como paga" uma fatura vinculada a gateway

Antes desta task, a fatura de qualquer empresa podia ser marcada como
paga manualmente, sem checar se isso batia com o provedor. Agora:
`platformMarkClinicInvoicePaidAction`,
`platformMarkClinicInvoiceOverdueAction` e
`platformUpdateClinicSubscriptionStatusAction` recusam operar (lançam
erro, não fazem silenciosamente nada diferente) quando a assinatura tem
`providerKind !== "MANUAL"`. Para essas empresas, a única forma de
"corrigir" o estado é através do próprio gateway: **Solicitar
sincronização** (consulta e aplica a verdade do provedor) —
nunca uma edição livre. Assinaturas `MANUAL` (legadas, sem gateway)
continuam podendo ser editadas à mão como sempre — não há provedor
para contradizer.

### Fluxo de divergência: detectar, depois corrigir

1. **Verificar divergência**
   (`platformCheckClinicSubscriptionDivergenceAction`) — consulta o
   provedor, compara com o status local, e só grava a *flag*
   `syncStatus: DIVERGED` se houver diferença. Não corrige nada
   sozinho.
2. Owner revisa a divergência (aparece no filtro "Divergência de
   conciliação" da lista de empresas e no card "Origem da cobrança" do
   workspace).
3. **Solicitar sincronização**
   (`platformResyncClinicSubscriptionAction`, já existente desde a
   PAY-003) — aplica a verdade do provedor ao registro local, usando a
   mesma função que os webhooks usam
   (`syncClinicSubscriptionFromGateway`). Se local e gateway já
   concordam, é um no-op sem nova entrada de auditoria — a sincronização
   nunca duplica receita nem estende período sozinha (só
   `recordSuccessfulGatewayPayment`, disparada por um pagamento real
   confirmado, estende período).

### Reembolso e chargeback

A fake gateway não modela reembolso nem chargeback (não simula
cobrança real). Quando um provedor real for contratado, o padrão
esperado é: o provedor processa o reembolso/chargeback do lado dele e
envia um webhook correspondente (ex.: `charge.refunded`,
`charge.dispute.created`); o handler de `/api/webhooks/billing`
precisa de um novo `case` mapeando esse evento para uma reversão local
— **nunca** para reembolso, a Sheep marca a fatura/pagamento
correspondente com um status que reflita isso e ajusta o acesso via
`syncClinicSubscriptionFromGateway`, do mesmo jeito que qualquer outro
evento. Até lá, uma disputa/reembolso relatado por uma empresa é tratado
como suporte manual: abrir chamado, registrar nota de suporte na
assinatura (`platformAddClinicBillingSupportNoteAction`) explicando o
que foi combinado, sem alterar o status da assinatura só por causa do
relato — a alteração real só deve acontecer quando confirmada pelo
provedor.

### Caminho de escalonamento financeiro

1. Suporte de plataforma identifica o caso pela lista de empresas
   (filtro "Falha de pagamento / tolerância" ou "Divergência de
   conciliação") ou pelo workspace da empresa.
2. Registra uma nota de suporte na assinatura descrevendo o
   combinado com o cliente.
3. Se resolver sozinho (cliente atualiza o cartão, sincroniza): usar
   "Gerar link de pagamento" para reenviar o cliente ao
   checkout/portal, depois "Solicitar sincronização" para confirmar.
4. Se não resolver (recusa persistente, disputa, valor incorreto): a
   nota de suporte já documenta o histórico; escalar para quem
   administra a conta do provedor (acesso ao painel real do provedor,
   fora desta plataforma) para investigar do lado da cobrança.
5. Nunca "forçar" o acesso de volta (marcar ativa manualmente) para uma
   assinatura vinculada a gateway só para destravar um cliente enquanto
   o caso está em aberto — isso é exatamente o que a guarda desta task
   impede, porque cria divergência silenciosa com o provedor.

### Indicadores de receita (MRR)

- **Receita SaaS mensal** (dashboard da plataforma e resumo de
  empresas) = soma de `ClinicInvoice.amount` com `status = PAID` e
  `paidAt` dentro do mês corrente. **Isso é receita conciliada
  (recebida), não uma projeção** — cada valor somado corresponde a um
  `ClinicPayment` real, criado só quando `recordSuccessfulGatewayPayment`
  (webhook) ou a ação manual equivalente (assinaturas `MANUAL`)
  confirma o pagamento.
- Não existe hoje um indicador de "MRR estimado" (soma do preço de
  todas as assinaturas `ACTIVE`/`TRIAL`, pago ou não) — só o valor
  efetivamente recebido é mostrado, para não misturar projeção com
  caixa. Se um indicador de estimativa for necessário no futuro, ele
  deve ser rotulado explicitamente como estimativa (nunca reaproveitar
  o rótulo "Receita SaaS mensal" para isso) para não confundir os dois
  conceitos.
- Pausas, cancelamentos, falhas e recuperação de pagamento não exigem
  nenhum ajuste retroativo neste indicador — ele é sempre um somatório
  de fatos já ocorridos (`ClinicPayment` criados), nunca recalculado a
  partir do status atual da assinatura.

### O que a visão do owner nunca mostra

- Número, validade ou CVV de cartão — o schema não tem campo para isso
  e a fake gateway nunca produz esse dado.
- Segredo de webhook (`FAKE_BILLING_WEBHOOK_SECRET` ou o equivalente
  real) — vive só em variável de ambiente, nunca é lido de volta para a
  UI.
- Payload bruto do webhook — a UI usa os campos já processados
  (`ClinicSubscription`, `ClinicInvoice`, `AuditLog.metadata`), nunca o
  corpo original da requisição.
- ID externo completo — mascarado (`fake_cus_ab12••••90f1`) no
  workspace da empresa; suficiente para suporte confirmar "é esta
  assinatura" sem expor o identificador inteiro em uma tela que várias
  pessoas podem ver.
