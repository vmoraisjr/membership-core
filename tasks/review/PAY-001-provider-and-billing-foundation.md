# PAY-001 — Provedor de cartão e fundação da assinatura recorrente SaaS — Relatório de Implementação

## Decisão do provedor (obrigatória antes de codar)

**Nenhum provedor de pagamento real foi contratado ainda.** Confirmado com
o usuário antes de iniciar (pergunta direta: "adapter + fake" vs.
"provedor já contratado" vs. "pausar") — a resposta escolhida foi o
caminho explicitamente permitido pelo próprio PAY-001 quando a escolha
não está disponível: implementar a porta/adaptador de provedor e um
fake determinístico para testes, **sem simular cobrança real e sem
acoplar a UI a uma marca específica**.

Consequência prática: toda a fundação (schema, máquina de estados,
provisionamento, auditoria) já está pronta para receber um provedor real
mais tarde — basta implementar `BillingGateway` e adicionar uma linha em
`getBillingGateway()`. Nenhum caller precisa mudar.

## Arquivos criados

- `features/billing/gateway/billing-gateway.types.ts` — a porta
  (`BillingGateway`) e os tipos de domínio (`BillingGatewaySubscription`,
  `BillingCheckoutSession`, `BillingPortalSession`, `BillingWebhookEvent`
  etc.). Interface definida por completo agora (inclui `createCheckoutSession`,
  `createPortalSession`, `pauseSubscription`, `resumeSubscription`,
  `cancelSubscription`, `verifyWebhookSignature`) mesmo que PAY-001 só
  use uma parte — decisão consciente de contrato-primeiro, já que
  PAY-002/003/004 dependem exatamente desses métodos e serão
  implementadas na sequência desta mesma execução do backlog.
- `features/billing/gateway/fake-billing-gateway.ts` — `FakeBillingGateway`:
  IDs determinísticos (`fake_cus_{clinicId}`, `fake_sub_{clinicId}` —
  mesmo clinicId sempre produz o mesmo ID, sem aleatoriedade), estado em
  memória (Maps a nível de módulo — dura o processo Node, reseta ao
  reiniciar; é um duplo de teste, não um sistema de registro), nenhuma
  chamada de rede, nenhum dado de cartão. Assinatura de webhook via
  HMAC-SHA256 real (`FAKE_BILLING_WEBHOOK_SECRET`, com default de dev) —
  não é um "sempre aceita", rejeita payload adulterado de verdade.
  Métodos `__*` (prefixo duplo-underscore, fora da interface pública
  `BillingGateway`) para simular o que um provedor real faria de forma
  assíncrona: completar/cancelar checkout, forçar um estado de
  assinatura — usados pela rota de fake-checkout (PAY-002) e pelos
  testes de webhook (PAY-003).
- `features/billing/gateway/get-billing-gateway.ts` — único ponto de
  seleção do gateway ativo. Hoje sempre retorna o fake; adicionar um
  provedor real é uma linha aqui, zero mudança nos callers.
- `features/billing/constants/billing-policy.ts` — `BILLING_POLICY`:
  `trialDays` (30), `paymentRetryToleranceDays` (7),
  `maxPaymentRetryAttempts` (3). Cada valor lê de variável de ambiente
  com fallback documentado — parametrizado e visível no código, não
  escondido em um componente de UI, como o PAY-001 exige.

## Arquivos modificados

- `prisma/schema.prisma` — `ClinicSubscription` ganhou `providerKind`
  (`BillingProviderKind`: `MANUAL`/`FAKE`), `externalCustomerId`,
  `externalSubscriptionId` (`@unique` — é a chave que PAY-003 vai usar
  para localizar a assinatura a partir de um evento de webhook),
  `syncStatus` (`BillingSyncStatus`: `SYNCED`/`PENDING`/`DIVERGED` —
  usado pela reconciliação da PAY-004), `lastSyncedAt`,
  `paymentRetryCount`, `nextPaymentAttemptAt`. Nenhum campo armazena
  número, validade ou CVV de cartão — só IDs opacos do gateway.
- `features/billing/services/billing-foundation.ts`:
  - `ensureDefaultClinicBillingPlan` — `trialDays` passou de `14`
    (hardcoded) para `BILLING_POLICY.trialDays` (30), fonte única.
  - `ensureClinicBillingFoundation` — ponto central desta task. Ao
    provisionar uma empresa nova (nenhuma assinatura reusável
    encontrada — CANCELED incluso, o que já impede um segundo trial
    automático sem intervenção do owner), agora: busca e-mail/nome da
    empresa, chama `gateway.createCustomer` +
    `gateway.createTrialSubscription`, persiste os IDs externos e
    `providerKind`/`syncStatus`/`lastSyncedAt` no mesmo `create`, e
    grava um audit log novo (`CREATE`/`CLINIC_SUBSCRIPTION`) com
    metadata contendo só IDs opacos — nunca dado de cartão. A criação
    da primeira fatura (`createClinicInvoiceForSubscription`,
    comportamento pré-existente) foi mantida sem alteração — ela já
    tinha seu próprio audit log e é consumida pela aba "Plano e
    cobrança" existente; não seria seguro removê-la agora sem antes
    migrar essa UI para faturas geradas via webhook (isso é
    explicitamente escopo da PAY-003, "fora do escopo" desta).
  - **Mudança de comportamento deliberada**: uma empresa nova agora
    nasce em **TRIAL** (não mais `PENDING`), com `trialEndsAt` já
    calculado. Antes, um admin de plataforma precisava clicar "Ativar
    teste" manualmente. Isso é exatamente o que o PAY-001 pede
    ("iniciar um único trial de 30 dias" no provisionamento). Não quebra
    o fluxo manual existente: `PENDING` continua sendo um destino válido
    de transição para assinaturas antigas/legadas
    (`providerKind: MANUAL`), e a ação "Ativar teste" na UI já some
    sozinha para uma assinatura que nasce em TRIAL — `TRIAL → TRIAL` não
    é uma transição válida no mapa existente
    (`CLINIC_SUBSCRIPTION_TRANSITIONS`), então o filtro de ações que já
    existia na UI simplesmente para de oferecer o botão, sem precisar de
    mudança na UI.
- `tests/billing/billing-hardening.test.ts` — 2 casos novos:
  - "fake billing gateway is deterministic and its webhook signature
    verification rejects tampered payloads" — mesmo `clinicId` produz o
    mesmo `externalCustomerId`; `clinicId`s diferentes produzem IDs
    diferentes; assinatura válida decodifica o evento; assinatura
    adulterada e assinatura ausente lançam erro.
  - "provisioning a clinic starts a single gateway trial and is
    idempotent against a second call" — primeira chamada de
    `ensureClinicBillingFoundation` num clinic novo entra em `TRIAL` com
    `providerKind: FAKE`, IDs externos presentes, e `trialEndsAt -
    startedAt` bate exatamente com `BILLING_POLICY.trialDays`; segunda
    chamada retorna a **mesma** assinatura (mesmo `id`, mesmo
    `externalSubscriptionId`) e a contagem de `ClinicSubscription` para
    aquele clinic permanece 1.

## Migração Prisma

`20260812100000_billing_gateway_foundation` — 2 enums novos +
7 colunas em `ClinicSubscription` + 1 índice único. Aplicada com
`prisma migrate deploy` (não `migrate dev`) depois de descobrir que
`migrate dev` está quebrado neste projeto para gerar/aplicar migrações
novas — ver "Achado de infraestrutura" abaixo. Nenhum dado existente foi
tocado ou perdido.

### Achado de infraestrutura (não introduzido por esta task)

`npx prisma migrate dev` falha neste banco local com "The migration
`20260606230000_user_management_completion` was modified after it was
applied" e pede reset completo do banco — apesar de `npx prisma migrate
status` confirmar que o schema está em dia e o arquivo daquela migração
não tem diferença de git. O problema está isolado ao processo de
shadow-database do `migrate dev` (que recria o banco do zero para
diffar), não ao banco real. Contornado escrevendo o SQL da migração à
mão e aplicando com `prisma migrate deploy` (que não usa shadow
database) — seguro, não destrutivo, confirmado por `migrate status`
depois. **Isso vai continuar acontecendo em qualquer migração futura**
até alguém investigar a causa raiz (suspeita: diferença de comportamento
do shadow DB entre o Postgres local e o que gerou aquela migração
específica). Recomendo abrir isso como item de manutenção de
infraestrutura separado.

## Fora do escopo (não alterado)

- Checkout, portal e qualquer ação visível ao cliente — PAY-002.
- Endpoint de webhook real e automação de cobrança — PAY-003 (os
  métodos de porta já existem, a rota HTTP não).
- Dashboard operacional/reconciliação do owner — PAY-004.
- PIX, boleto, cupom, impostos, nota fiscal, pagamentos de pacientes.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:billing` — ✅ 9 cenários (7 pré-existentes sem regressão +
  2 novos desta task).
- `pnpm test:tenant` — ✅ 11 cenários, sem regressão.
- `pnpm test:rbac` — ✅ 5 cenários, sem regressão.
- `pnpm test:audit` — ✅ 8 cenários, sem regressão (inclui o teste
  pré-existente que chama `ensureClinicBillingFoundation` diretamente e
  espera um audit log de `CLINIC_INVOICE` — continua passando).
- Playwright contra build de produção, login real como Owner Operator:
  criada uma empresa nova pelo formulário real (`Criar empresa`);
  aberta a aba "Plano e cobrança" e confirmado ao vivo: **Status: Teste**
  imediatamente após a criação (sem clicar em "Ativar teste"), "Início"
  e "Trial até" com exatamente 30 dias de diferença, fatura inicial
  presente. Consulta direta ao banco confirmou `providerKind: FAKE`,
  `externalCustomerId`/`externalSubscriptionId` determinísticos
  (`fake_cus_{clinicId}`/`fake_sub_{clinicId}`), `syncStatus: SYNCED`, e
  o audit log `CLINIC_SUBSCRIPTION`/`CREATE` com metadata livre de
  qualquer dado sensível.

## Critérios de aceite

- ✅ Decisão do provedor documentada (adapter + fake, confirmada com o
  usuário) e adaptador testável sem chamar API real.
- ✅ Nenhum número, validade ou CVV de cartão entra no banco, logs ou
  Server Actions — nem a fake gateway nem o schema têm campo para isso.
- ✅ Uma empresa não consegue ter dois trials/assinaturas recorrentes
  válidos simultaneamente — `ensureClinicBillingFoundation` reusa
  qualquer assinatura existente (incluindo `CANCELED`); testado
  explicitamente (chamada dupla retorna a mesma assinatura).
- ✅ Trial padrão de 30 dias, vencimento inequívoco no domínio
  (`trialEndsAt` gravado no momento da criação, não calculado
  implicitamente na UI) — confirmado ao vivo e por teste automatizado.
- ✅ Migração Prisma aplicada, isolamento por `clinicId` preservado
  (nenhuma mudança em `filterByClinic`/RBAC), auditoria preservada e
  estendida.

## Riscos

- Baixo-médio: mudar o status inicial de `PENDING` para `TRIAL` é uma
  mudança de comportamento observável (não só interna) — mitigado por:
  nenhum teste dependia do status `PENDING` inicial (confirmado por
  varredura), a transição `TRIAL→TRIAL` já não existia no mapa de
  transições (então a UI de "Ativar teste" já reage corretamente sem
  mudança própria), e a mudança só afeta provisionamento **novo** —
  empresas já existentes continuam exatamente como estavam.
- Baixo: chamada ao gateway acontece **dentro** da transação Prisma de
  `createClinic` (`tx`). Aceitável com o fake (síncrono, em memória,
  zero I/O de rede) mas **não deve ser copiado como padrão** quando um
  provedor real for implementado — chamada de rede dentro de uma
  transação de banco segura lock por mais tempo que o necessário e
  arrisca inconsistência se a chamada externa for lenta ou falhar após
  o commit local. Sinalizando aqui como ajuste arquitetural necessário
  antes de plugar um provedor real (mover a chamada para fora da `tx`
  com um padrão de criação idempotente + retry).
- Baixo: workaround de `migrate deploy` em vez de `migrate dev` — documentado
  acima como achado de infraestrutura pré-existente, não introduzido por
  esta task, mas relevante para quem for rodar a próxima migração.

## Próxima task

`PAY-002-company-checkout-and-self-service.md` — seguindo em sequência.
