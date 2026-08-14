# PAY-004 — Visão owner: operação, conciliação e suporte da cobrança — Relatório de Implementação

## Objetivo

Completar a visão do owner da Sheep para acompanhar receita e saúde
das assinaturas recorrentes, investigar divergências e ajudar uma
empresa sem voltar ao processo manual de "marcar como pago".

## Achado real mais importante desta task

A aba "Plano e cobrança" (UI-053) já permitia ao owner marcar **qualquer**
fatura como paga e forçar **qualquer** transição de status manualmente
— inclusive para empresas já vinculadas ao gateway (FAKE, desde a
PAY-001), sem checar se isso batia com o que o provedor realmente
sabia. Isso contradiz diretamente o critério de aceite mais explícito
da PAY-004: "Não permitir ao owner gravar uma fatura como paga sem
evidência do provedor." Corrigido com uma guarda no **servidor** (não
só escondendo o botão) em 3 actions:
`platformMarkClinicInvoicePaidAction`,
`platformMarkClinicInvoiceOverdueAction` e
`platformUpdateClinicSubscriptionStatusAction` — todas agora recusam
operar quando `subscription.providerKind !== "MANUAL"`. Assinaturas
legadas (`MANUAL`, sem gateway) continuam funcionando exatamente como
antes — a guarda é aditiva, não regressiva.

## Fluxo de conciliação: detectar, depois corrigir

Dois passos deliberadamente separados, nunca um auto-fix silencioso:

1. **Verificar divergência**
   (`features/billing/actions/platform-check-clinic-subscription-divergence.ts`,
   nova) — consulta o gateway, compara com o status local, e só grava
   `syncStatus: DIVERGED` se houver diferença. Não corrige nada.
2. **Solicitar sincronização** (`platformResyncClinicSubscriptionAction`,
   já existente desde a PAY-003) — aplica a verdade do gateway via
   `syncClinicSubscriptionFromGateway`, a mesma função usada pelos
   webhooks. Se já estão em sincronia, é um no-op sem nova entrada de
   auditoria.

## Ações seguras que substituem as manuais (para assinaturas gateway-linked)

- **Solicitar sincronização** e **Verificar divergência** (acima).
- **Gerar link de pagamento**
  (`platform-generate-clinic-payment-link.ts`, nova) — cria uma sessão
  de checkout (se `TRIAL`/`PAST_DUE`) ou de portal (demais casos) via
  gateway e devolve a URL num diálogo copiável. O owner **não completa
  o checkout nem acessa o portal em nome do cliente** — as páginas
  `/fake-checkout`/`/fake-portal` conferem que o usuário logado
  pertence ao mesmo `clinicId` da sessão (PAY-002), então um owner de
  plataforma (sem `clinicId`) nunca passaria nessa checagem mesmo que
  tentasse.
- **Registrar nota de suporte**
  (`platform-add-clinic-billing-support-note.ts`, nova) — texto livre
  gravado como mais uma entrada de `AuditLog` (mesma timeline que já
  existia, nenhum sistema de notas paralelo).

Todas as 3 novas actions replicam a mesma guarda `assertPlatformOwner`
já usada pelas actions de billing de plataforma existentes — sem
sistema de permissão novo.

## Filtros na lista de empresas

`features/clinic/components/clinic-table.tsx` ganhou um 3º filtro
("Situação de cobrança", só visível em `isPlatformView`): Trial
terminando em breve (≤7 dias), Falha de pagamento/tolerância
(`PAST_DUE`), Pausada (`PAUSED`), Cancelamento agendado
(`cancelAtPeriodEnd`), Divergência de conciliação
(`syncStatus === "DIVERGED"`). Nenhuma mudança de query — os campos já
vinham do banco via `clinicIncludeArgs()` (usa `include`, não
`select`, então `trialEndsAt`/`cancelAtPeriodEnd`/`syncStatus` já
estavam sendo buscados desde a PAY-001/002/003, só não expostos na UI).
**Decisão de consolidação**: o pedido original citava 6 categorias
("trial próximo do fim, cartão pendente, falha/tolerância, pausada,
cancelada e divergência") — "cartão pendente" e "falha/tolerância"
mapeiam para o mesmo sinal (`PAST_DUE`) neste modelo de domínio; usar
uma categoria fabricada duplicada seria menos honesto que consolidar
as duas, documentado aqui em vez de escondido.

## Timeline e proteção de dados sensíveis

- `CompanyBillingTab` ganhou um card "Origem da cobrança" (rótulo
  humano — "Cartão via provedor (simulado)"/"Manual", nunca o nome
  cru do enum) mostrando `syncStatus` e `lastSyncedAt`.
- Um banner amarelo aparece quando `PAST_DUE` (tentativa X de
  `BILLING_POLICY.maxPaymentRetryAttempts`, próxima tentativa) ou
  quando há cancelamento agendado — mesma informação que a aba
  self-service da empresa já mostra (PAY-002), agora também visível
  para o owner.
- ID externo mostrado sempre mascarado
  (`maskExternalId`: `fake_sub_c••••6vnz`) na tela mais visível
  (workspace da empresa). A timeline de auditoria mais profunda
  continua guardando o ID completo em `AuditLog.metadata` — decisão
  deliberada: um engenheiro de suporte investigando um caso real
  precisa poder cruzar com o painel do provedor de verdade; mascarar
  ali destruiria essa utilidade sem ganho real de segurança (não é
  segredo, é um identificador opaco, e a tela de auditoria já é
  restrita a owner/admin de plataforma).
- Nenhuma tela nova ou existente mostra número/validade/CVV de cartão,
  segredo de webhook ou payload bruto — nada disso tem campo no schema
  para vazar.

## Indicador de receita (MRR)

Já existia (`monthlySaasRevenue` = soma de `ClinicInvoice.amount` com
`status = PAID` no mês corrente) e já era, por construção, "só
recebido" — não precisou de mudança de código. O que faltava era a
**definição documentada** e a separação explícita entre estimativa e
recebido, agora em `docs/billing-webhook-runbook.md`: não existe hoje
um indicador de MRR estimado (projeção de assinaturas ativas
independente de pagamento); só o valor conciliado é mostrado, e o
runbook deixa registrado que um indicador de estimativa futuro precisa
de rótulo próprio para não ser confundido com este.

## Arquivos criados

- `features/billing/actions/platform-check-clinic-subscription-divergence.ts`
- `features/billing/actions/platform-generate-clinic-payment-link.ts`
- `features/billing/actions/platform-add-clinic-billing-support-note.ts`
- `features/billing/components/company-billing-support-actions.tsx`
  (client component com os 4 botões seguros + diálogos de nota/link)

## Arquivos modificados

- `features/billing/actions/platform-manage-clinic-subscription.ts` —
  guarda `providerKind === "MANUAL"` em 3 actions (ver "Achado real"
  acima).
- `features/billing/components/company-billing-tab.tsx` — card "Origem
  da cobrança", banner de tentativa/tolerância/cancelamento agendado,
  ID externo mascarado, `statusActions`/ações de fatura condicionadas a
  `!isGatewayLinked`, `CompanyBillingSupportActions` renderizada quando
  `isGatewayLinked`.
- `features/clinic/components/clinic-table.tsx` — filtro "Situação de
  cobrança" (5 categorias).
- `messages/pt-BR.json` — chaves do novo filtro.
- `docs/billing-webhook-runbook.md` — seção "Operação do owner
  (PAY-004)": permissões, fluxo de divergência, reembolso/chargeback
  (comportamento esperado quando um provedor real existir), caminho de
  escalonamento financeiro, definição do indicador de MRR, o que a
  visão do owner nunca mostra.
- `tests/billing/billing-hardening.test.ts` — 2 casos novos (guarda de
  ação manual + fluxo detectar/corrigir divergência).

## Fora do escopo (não alterado)

- `PlatformPlanChangeDialog` (trocar o plano comercial de uma
  assinatura) permanece disponível mesmo para assinaturas
  gateway-linked — mudar o plano local não tem, hoje, um conceito
  equivalente de "preço" no lado do provedor para contradizer (a fake
  gateway não modela catálogo de preços). Sinalizado como ponto de
  atenção para quando um provedor real for integrado: nesse momento,
  trocar de plano provavelmente também deveria passar por uma chamada
  ao gateway (mudar o price ID da assinatura), não só uma escrita
  local.
- Reembolso/chargeback automatizado — a fake gateway não simula isso;
  documentado no runbook como comportamento esperado futuro + processo
  manual de suporte enquanto isso.
- Cron/job agendado — mesma limitação conhecida documentada desde a
  PAY-003.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings (1 warning
  temporário de forms sem `action` corrigido durante o desenvolvimento
  — bug real encontrado pelo próprio lint: os 2 forms de "Solicitar
  sincronização"/"Verificar divergência" tinham só `input` oculto e
  nenhum `action=` de fato ligado ao Server Action).
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:billing` — ✅ 15 cenários (13 prévios + 2 novos: guarda de
  ação manual bloqueando gateway-linked mas permitindo `MANUAL`, e
  fluxo detectar-divergência-depois-sincronizar).
- `pnpm test:tenant` — ✅ 11 cenários, sem regressão.
- `pnpm test:rbac` — ✅ 5 cenários, sem regressão.
- Playwright contra build de produção, fluxo completo real: criada
  empresa → webhook `payment.failed` real disparado →
  `/dashboard/empresas` filtrado por "Falha de pagamento / tolerância"
  encontra a empresa → aba "Plano e cobrança" mostra origem da
  cobrança, banner "tentativa 1 de 3", ID mascarado, e **nenhum** botão
  de marcar-como-paga/mudar-status manualmente → "Verificar
  divergência" → "Solicitar sincronização" (ambos sem erro) → "Gerar
  link de pagamento" → diálogo com o link copiável e o aviso de que a
  Sheep não completa em nome do cliente → "Registrar nota de suporte" →
  nota salva → aba "Auditoria" mostra a timeline completa incluindo a
  nota e as ações de sincronização, todas atribuídas ao ator correto.

## Critérios de aceite

- ✅ Owner identifica em poucos cliques qual empresa precisa agir
  (filtro "Situação de cobrança") e qual é a próxima ação (banner de
  tentativa/tolerância + botões contextuais), sem confundir com
  cobrança de paciente (aba separada, nunca mencionada aqui).
- ✅ Divergência é detectável (`Verificar divergência`), sincronizável
  (`Solicitar sincronização`) e auditada (audit log em ambos os
  passos); sincronizar não duplica receita nem período —
  `syncClinicSubscriptionFromGateway` só atualiza status/datas, quem
  cria fatura/pagamento é exclusivamente
  `recordSuccessfulGatewayPayment` (disparado por webhook real).
- ✅ Visão exibe só dados necessários para suporte — sem cartão, sem
  segredo de webhook, sem payload bruto, ID externo mascarado na tela
  principal.
- ✅ Métricas e histórico permanecem consistentes após pausas,
  cancelamentos, falhas e recuperação — já garantido pelas PAY-002/003
  (mesma fonte de verdade, `syncClinicSubscriptionFromGateway`), sem
  caminho novo de escrita nesta task que pudesse divergir disso.

## Riscos

- Baixo: a guarda de `providerKind === "MANUAL"` é uma mudança de
  comportamento real (3 actions passam a recusar operar em certos
  casos) — mitigado por: nenhum teste existente dependia do
  comportamento antigo (confirmado por varredura), a guarda é
  logicamente exigida pelo próprio critério de aceite da task, e o
  caminho de correção seguro (sincronizar) sempre existe como
  alternativa.
- Baixo: troca de plano comercial não gated para gateway-linked — risco
  documentado acima, não bloqueante para o V1 (a fake gateway não tem
  conceito de preço para contradizer).

## Fase de pagamentos recorrentes (PAY-001 a PAY-004) — encerramento

Com a PAY-004 aprovada, a fase de cobrança recorrente por cartão está
completa de ponta a ponta: fundação e decisão de provedor (PAY-001),
autoatendimento da empresa — teste, checkout, portal, pausa,
cancelamento (PAY-002), reação automática a eventos do provedor via
webhook idempotente com controle de acesso por tolerância (PAY-003), e
a operação/suporte do owner sem nunca precisar "forçar" um estado que
contradiga o provedor (PAY-004). Toda a fundação está pronta para
receber um provedor real: implementar `BillingGateway` e trocar uma
linha em `getBillingGateway()` — nenhum caller muda.
