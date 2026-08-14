# PAY-002 — Jornada da empresa: teste, cartão, pausa e cancelamento — Relatório de Implementação

## Objetivo

Dar ao administrador da própria empresa uma área de cobrança simples:
ver o estado do teste/assinatura, cadastrar cartão pelo checkout seguro,
acompanhar a próxima cobrança, pausar e cancelar sem abrir chamado —
tudo separado dos pagamentos de pacientes.

## Rota canônica e ponto de navegação

Nova aba **Assinatura** em `/dashboard/company?tab=assinatura` — dentro
de "Minha empresa", que já era o ponto de navegação mais natural do
workspace da própria clínica (mesmo padrão de abas usado no workspace
"Empresa" da plataforma desde a UI-053). A aba "Perfil" (conteúdo
pré-existente: identidade, dados cadastrais, chamado cadastral) ficou
intacta; o card "Plano SaaS" que antes vivia solto na aba Perfil virou
um link curto para a nova aba, evitando duas fontes do mesmo dado.

## Decisões de modelagem (2 migrações pequenas)

1. Novo status `PAUSED` em `ClinicSubscriptionStatus` — deliberadamente
   **distinto** de `SUSPENDED` (que continua sendo a ação
   administrativa da plataforma, UI-053). Pausar é uma ação do próprio
   cliente; misturar os dois no mesmo status tornaria impossível
   diferenciar "o cliente pausou" de "a Sheep suspendeu por
   inadimplência" — distinção que a PAY-004 já pede explicitamente como
   filtros separados.
2. Novo campo `cancelAtPeriodEnd: Boolean` em `ClinicSubscription` —
   modela "cancelamento agendado" sem inventar mais um status. Cancelar
   uma assinatura ACTIVE/TRIAL/PAST_DUE não desliga nada na hora; só
   marca a flag. O acesso e a cobrança continuam normalmente até
   `expiresAt`. Cancelar uma assinatura já PAUSADA (sem período correndo
   para proteger) é imediato.

Migrações aplicadas com o mesmo workaround documentado no relatório da
PAY-001 (`prisma migrate deploy` em vez de `migrate dev`, por causa do
problema de shadow-database pré-existente no ambiente).

## Arquivos criados

- `app/fake-checkout/[sessionId]/page.tsx` e
  `app/fake-portal/[customerId]/page.tsx` — páginas standalone (fora do
  layout `(dashboard)`, deliberadamente com visual neutro para deixar
  claro "isto simula sair da Sheep"), implementando os dois métodos de
  `BillingGateway` que a PAY-001 já havia definido no contrato mas não
  usava ainda. Cada uma confere que o usuário logado pertence à mesma
  empresa da sessão de checkout antes de aprovar/cancelar — sem isso,
  um ID de sessão adivinhado poderia mexer na assinatura de outra
  empresa.
- `features/billing/actions/fake-checkout-actions.ts` —
  `approveFakeCheckoutAction`/`cancelFakeCheckoutAction`: confirmam a
  sessão pertence ao clinicId do usuário logado, avançam o estado da
  fake gateway, e sincronizam a assinatura local a partir da resposta
  real da gateway (nunca por suposição).
- `features/billing/actions/company-subscription-actions.ts` — 6
  actions self-service (`startCompanyCheckoutAction`,
  `openCompanyPortalAction`, `pauseCompanySubscriptionAction`,
  `resumeCompanySubscriptionAction`,
  `requestCompanySubscriptionCancellationAction`,
  `undoCompanySubscriptionCancellationAction`). Nenhuma recebe
  `clinicId` como parâmetro — todas derivam via `getCurrentClinicId()`,
  então não existe payload nem URL que consiga mirar a assinatura de
  outra empresa. `assertPermission("clinic","manage")` (OWNER/ADMIN da
  própria empresa) — mesma matriz de RBAC já existente, sem duplicar
  sistema de permissão.
- `features/clinic/components/company-subscription-tab.tsx` — a UI:
  3 `MetricCard`s (plano/preço, status, próxima cobrança), explicação
  em linguagem não técnica por status ("o que acontece se nada for
  feito"), banners de retorno de checkout (sucesso/pendente/cancelado —
  ver seção de verificação abaixo), botões condicionados ao estado
  real (`Continuar após o teste` só em TRIAL/PAST_DUE, `Pausar` só em
  ACTIVE/TRIAL, `Retomar` só em PAUSED, `Cancelar` escondido quando já
  há cancelamento agendado), e o bloco "Cancelamento agendado... Manter
  assinatura" quando `cancelAtPeriodEnd`.

## Arquivos modificados

- `features/billing/services/billing-foundation.ts`:
  - `CLINIC_SUBSCRIPTION_TRANSITIONS`/`_REUSABLE_STATUSES` — `PAUSED`
    adicionado nos dois, com transições `ACTIVE/TRIAL/PAST_DUE ⇄
    PAUSED ⇄ CANCELED`.
  - `deriveAutomatedClinicSubscriptionStatus` — novo check de
    prioridade máxima: `cancelAtPeriodEnd && expiresAt` no passado →
    `CANCELED`. Só cancela de verdade quando o período combinado
    termina, nunca antes.
  - `reconcileClinicSubscriptionAutomation` — passou a excluir `PAUSED`
    da varredura automática (pausa é controlada pelo cliente, não deve
    ser mexida por heurística de fatura) e foi **exportada** (era
    privada) para ser testável diretamente.
  - Nova `syncClinicSubscriptionFromGateway(subscriptionId,
    gatewaySubscription, ...)` — único lugar que aplica "o que a
    gateway respondeu" ao registro local (status, `expiresAt`,
    `canceledAt`, `syncStatus: SYNCED`), com audit log quando o status
    muda. Reutilizada pelas actions de pausar/retomar/cancelar e pelo
    fake-checkout — a mesma função que a PAY-003 (webhooks) e a PAY-004
    (resync manual) vão chamar.
  - Nova `getCompanySubscriptionOverview({ verifyWithGateway })` — dado
    self-service da aba Assinatura. Quando `verifyWithGateway` é
    verdadeiro (definido pela própria página quando há um `?checkout=`
    na URL), pergunta à gateway o estado atual antes de renderizar —
    nunca confia apenas na query string de retorno.
- `features/clinic/utils/clinic-status.ts` — `PAUSED` mapeado
  explicitamente para tom `warning` (antes cairia no `default`).
- `features/clinic/components/company-profile-page.tsx` — ganhou as
  duas abas (Perfil/Assinatura) reaproveitando o mesmo padrão de barra
  de abas usado no workspace da empresa (plataforma); "Plano SaaS"
  virou link curto para a aba nova.
- `app/(dashboard)/dashboard/company/page.tsx` — lê `tab`/`checkout` da
  URL e repassa.
- `components/dashboard/clinic-plan-activation-required.tsx` — texto e
  CTA atualizados para apontar direto para a nova aba de autoatendimento
  em vez de implicar que só "o master da plataforma" pode agir.

## Bug real encontrado e corrigido ao vivo

Ao testar "Pausar" de ponta a ponta, a barra lateral inteira da empresa
sumiu — inclusive o item "Minha empresa", a única porta de volta para
"Retomar". Causa: `hasOperationalAccess` (calculado a partir de
`canClinicOperate`, que já excluía corretamente PAUSED do "pode
operar") esconde toda a seção "operation" do menu quando falso —
incluindo o próprio item que leva à tela que resolveria o bloqueio.
Antes da PAY-002 isso já existia mas era raro de alcançar (só via
suspensão administrativa); agora "Pausar" é um botão de um clique que
qualquer admin de empresa aciona sozinho, tornando essa armadilha
comum. Corrigido com uma flag `alwaysVisible` no item "Minha empresa"
do `dashboard-sidebar.tsx`, exceção mínima e explícita à regra de
esconder a seção operacional — confirmado ao vivo: pausar agora deixa
só "Minha empresa" visível na barra lateral, exatamente o suficiente
para retomar.

## Fora do escopo (não alterado)

- Processar webhooks/retries automáticos e bloquear acesso sozinho —
  PAY-003. A UI já sabe RENDERIZAR os estados (PAST_DUE, tentativas),
  só não há ainda o mecanismo que os produz automaticamente.
- Painel financeiro agregado do owner — PAY-004.
- `update-clinic-branding.ts` e qualquer fluxo administrado pela
  plataforma (UI-053's `CompanyBillingTab`) — inalterados; a plataforma
  continua com sua própria aba "Plano e cobrança" para conciliação
  manual, agora convivendo com o autoatendimento sem conflito (mesmas
  tabelas, mesma `syncClinicSubscriptionFromGateway` quando aplicável).

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings (2 rodadas, uma
  antes e outra depois do fix do sidebar).
- `pnpm --dir apps/web build` — ✅ build de produção concluído (2
  rodadas), incluindo as 2 rotas novas (`/fake-checkout/[sessionId]`,
  `/fake-portal/[customerId]`).
- `pnpm test:billing` — ✅ 10 cenários (7 prévios + 1 da PAY-001 + 1
  novo desta task cobrindo pausar/retomar/cancelar/desfazer/RBAC
  staff-bloqueado/reconciliação de período).
- `pnpm test:tenant` — ✅ 11 cenários, sem regressão.
- `pnpm test:rbac` — ✅ 5 cenários, sem regressão.
- Playwright contra build de produção, jornada completa e real: criar
  empresa → capturar credencial temporária do master → login →
  primeiro acesso (troca de senha obrigatória) → aba Assinatura em
  TRIAL → "Continuar após o teste" → checkout simulado → aprovar →
  banner "Pagamento confirmado" + status "Ativa" → Pausar (confirmado)
  → Retomar (confirmado) → Cancelar (confirmado) → banner "Cancelamento
  agendado... Manter assinatura" → desfazer → Portal de pagamento
  simulado. Todos os passos confirmados por screenshot e por
  `page.url()`.

## Critérios de aceite

- ✅ Cliente em trial entende a data limite (metric card "Status" mostra
  "Teste até {data}") e inicia checkout sem expor cartão à Sheep — a
  simulação nunca coleta nem exibe campo de cartão.
- ✅ Cliente ativo identifica plano, valor, próxima renovação e
  consegue atualizar cartão, pausar ou cancelar com confirmação —
  todos os botões passam por `ConfirmSubmitButton`/`ConfirmDialog`
  existentes, nenhum diálogo novo criado.
- ✅ Retorno de checkout cancelado ou pagamento pendente não ativa
  acesso — a verificação é sempre contra `gateway.getSubscription()`,
  nunca contra a query string sozinha; testado no banner "ainda não
  confirmou" quando o estado real diverge do esperado.
- ✅ Usuário de outra empresa não lê nem altera a assinatura por URL,
  action ou ID manipulado — nenhuma action aceita `clinicId` externo;
  as páginas de fake-checkout/portal conferem o clinicId da sessão
  contra o usuário logado.

## Riscos

- Baixo: o "resume" da fake gateway confirma a cobrança de forma
  síncrona e imediata — um provedor real normalmente confirma via
  webhook assíncrono. Documentado como simplificação da fake, não como
  comportamento a copiar ao implementar um provedor real.
- Baixo: a correção do sidebar (`alwaysVisible`) é aditiva e afeta só
  um item específico — sem mudança de comportamento para os demais.

## Próxima task

`PAY-003-webhooks-renewal-and-access-control.md` — seguindo em
sequência.
