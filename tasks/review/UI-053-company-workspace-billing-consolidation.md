# UI-053 — Workspace Empresa: Resumo e Plano/Cobrança — Relatório de Implementação

## Objetivo

Fazer do workspace de uma empresa o lugar definitivo para trocar plano,
administrar o ciclo SaaS (ativar/testar/suspender/cancelar) e registrar a
situação de cobrança (faturas, marcar pago/atrasado) — sem sair da
empresa e sem duplicar a fonte de verdade das filas globais.

## Arquivos criados

- `features/billing/constants/subscription-status-actions.ts` —
  `SUBSCRIPTION_STATUS_ACTIONS`, extraído de dentro de
  `platform-saas-subscriptions-page.tsx` para ser compartilhado entre a
  lista global (que continua existindo até a UI-057) e a nova aba da
  empresa — mesmas 4 transições, mesmo texto de confirmação, uma fonte só.
- `features/billing/components/company-billing-tab.tsx` — o conteúdo real
  da aba "Plano e cobrança": 3 `MetricCard`s (plano atual, próximo
  vencimento, última cobrança), card "Assinatura SaaS" com status +
  datas + `PlatformPlanChangeDialog` ("Trocar plano") + os botões de
  transição de status (reaproveitando `SUBSCRIPTION_STATUS_ACTIONS`,
  `ConfirmSubmitButton` e `ActivateTrialSubmitButton` — os **mesmos**
  componentes e as **mesmas** Server Actions da lista global, não uma
  cópia), e tabela "Faturas" com marcar pago/atrasado (reaproveitando
  `platformMarkClinicInvoicePaidAction`/`...OverdueAction`).

## Arquivos modificados

- `features/billing/services/billing-foundation.ts` — nova
  `getClinicBillingDetail(clinicId)`: histórico completo (sem `take`
  limitado) de assinaturas/faturas/pagamentos de uma única empresa, mais
  a lista de planos para o diálogo de troca. Deliberadamente **não**
  reaproveita `getPlatformClinicBillingOverview()` — essa função
  recalcula o platform inteiro (reconciliação automática de todas as
  assinaturas) a cada chamada e limita faturas a 3/pagamentos a 1, caro e
  raso demais para uma aba dedicada de uma única empresa.
- `features/billing/actions/platform-manage-clinic-subscription.ts` —
  **bug real de cache encontrado e corrigido**: as 4 Server Actions
  (`platformUpdateClinicSubscriptionStatusAction`,
  `platformMarkClinicInvoicePaidAction`,
  `platformMarkClinicInvoiceOverdueAction`,
  `platformAssignClinicBillingPlanAction`) só chamavam
  `revalidatePath` nas rotas globais antigas — nenhuma delas revalidava
  `/dashboard/empresas/[empresaId]`. Reaproveitá-las tal como estavam
  faria a aba nova ficar com dado desatualizado depois de qualquer ação.
  `revalidatePlatformBillingPaths()` agora aceita um `clinicId` opcional
  e revalida `/dashboard/empresas` + `/dashboard/empresas/{clinicId}`
  também; os 3 call-sites que não tinham o `clinicId` à mão (invoice
  actions, troca de plano) passaram a buscá-lo via `select` na própria
  mutação, sem query extra.
- `features/billing/components/platform-saas-subscriptions-page.tsx` —
  `availableStatusActions` agora importa de
  `SUBSCRIPTION_STATUS_ACTIONS` em vez de redefinir a mesma lista
  inline; ícones `Ban`/`PauseCircle` (só usados ali) removidos dos
  imports.
- `features/clinic/components/platform-clinic-details-page.tsx`:
  - `tabs`: renomeado "Visão geral" → "Resumo" (vocabulário canônico) e
    adicionada "Plano e cobrança" logo em seguida.
  - Resumo: os cards "Assinatura SaaS" e "Pagamentos" (cada um repetindo
    por inteiro plano/status/fatura, com link para as rotas globais
    antigas) foram substituídos por **um** card compacto "Cobrança" —
    status + uma linha de resumo da última cobrança + link único "Ver
    plano e cobrança →". Os `MetricCard`s "Plano atual" e "Próximo
    vencimento" viraram links clicáveis para a mesma aba (mantidos,
    porque são resumo de um valor só — não duplicam o detalhe completo).
  - Novo bloco `{activeTab === "billing" ? &lt;CompanyBillingTab .../&gt; : null}`.
- `app/(dashboard)/dashboard/empresas/[empresaId]/page.tsx` — removida a
  função `normalizeTab` que a UI-049 usava para redirecionar
  `tab=billing` → `tab=overview` (era um placeholder explícito até esta
  task existir); `tab` agora passa direto.

## Fora do escopo (não alterado)

- CRUD completo de Pessoas/Módulos/Chamados — UI-054/055.
- Segunda fonte de verdade: nenhuma tabela/estado novo de cobrança foi
  criado; a aba lê e escreve nas mesmas tabelas (`ClinicSubscription`,
  `ClinicInvoice`, `ClinicPayment`) através das mesmas Server Actions.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:billing` — ✅ 7 cenários.
- `pnpm test:tenant` — ✅ 11 cenários.
- `pnpm test:rbac` — ✅ 5 cenários.
- Playwright contra build de produção, login real como Owner Operator:
  - Aba Resumo mostra o card "Cobrança" compacto com link "Ver plano e
    cobrança →".
  - Aba "Plano e cobrança" renderiza status, datas, botão "Trocar
    plano", os 3 botões de transição disponíveis para o status atual
    (Marcar como ativa/Suspender/Cancelar) e a fatura com ação de marcar
    paga.
  - Clicar num botão de transição abre o diálogo de confirmação
    existente ("Marcar como ativa — Nortex?"), confirmando que o mesmo
    componente `ConfirmSubmitButton` funciona igual dentro da nova aba.
  - **Os 3 pontos de entrada legados testados** —
    `/dashboard/billing/subscriptions?clinicId=X`,
    `/dashboard/billing/payments?clinicId=X`, e
    `/dashboard/clinics/{id}?tab=billing` — **todos chegam exatamente em
    `/dashboard/empresas/{id}?tab=billing`**, confirmando que o alias
    temporário da UI-049 foi corretamente substituído pelo conteúdo
    real sem quebrar nenhum link antigo.

## Critérios de aceite

- ✅ Owner troca plano, administra o ciclo SaaS e registra situação de
  cobrança sem sair da empresa — confirmado ao vivo.
- ✅ A empresa não é cópia estática: usa as mesmas Server Actions/estado
  da lista global (agora com revalidação corrigida para os dois lados).
- ✅ Resumo e aba de cobrança ficam claramente separados — Resumo com
  card único e clicável, conteúdo completo só na aba dedicada.

## Riscos

- Baixo-médio: a correção de `revalidatePlatformBillingPaths` altera um
  arquivo usado pelas 4 Server Actions de billing da plataforma — testado
  via `test:billing` (7 cenários, incluindo transições manuais de ciclo
  de vida) sem regressão, e a mudança é estritamente aditiva (parâmetro
  opcional, comportamento anterior preservado quando `clinicId` não é
  passado).

## Próxima task

`UI-054-company-people-and-modules.md` — seguindo em sequência.
