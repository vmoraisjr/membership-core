# UI-067 — Empresa: Retirada de Caminhos Legados e Regressão de Permissões — Relatório de Implementação

## Entrega

Auditoria completa de `href`, `redirect`, `router.push/replace` e
`revalidatePath` em todo o escopo da empresa (`rg` por
`/dashboard/(patients|plans|subscriptions|benefits|benefit-usage|payments|company|modules|messages|users)`
em todo `apps/web`, excluindo CRM). Achados corrigidos:

- **`clinic-plan-activation-required.tsx`** — o card "Operação aguardando
  regularização" (mostrado quando o SaaS está bloqueado, exatamente o
  cenário mais sensível) linkava para `/dashboard/company?tab=assinatura`.
  Corrigido para `minhaEmpresaUrl({tab:"subscription"})`.
- **`fake-portal/[customerId]/page.tsx`** — o retorno padrão do portal de
  pagamento simulado (quando não há `returnUrl` seguro) apontava para
  `/dashboard/company`. Corrigido para a Assinatura Sheep canônica.
- **`company-subscription-actions.ts`** — `COMPANY_SUBSCRIPTION_PATH`
  (usado nas URLs de sucesso/cancelamento do checkout simulado, no retorno
  do portal e em quatro `revalidatePath`) apontava para
  `/dashboard/company` com `tab=assinatura`. Corrigido para
  `/dashboard/minha-empresa` com `tab=subscription`, alinhado ao restante
  do app.
- **`app/(dashboard)/dashboard/billing/page.tsx`** — redirecionava a
  empresa para o intermediário legado `/dashboard/payments` em vez de ir
  direto para `/dashboard/cobrancas`.
- **`support-threads-page.tsx`** — o `returnToBase` usado no formulário de
  novo chamado (contexto de empresa) apontava para `/dashboard/messages`
  em vez de `/dashboard/minha-empresa?tab=support` diretamente.
- **`revalidatePath`** em oito Server Actions (`update-membership-plan`,
  `delete-patient-permanently`, `reactivate-patient`, `suspend-patient`,
  `delete-membership-plan-permanently`, `clone-membership-plan`,
  `delete-membership-benefit-permanently`, `update-membership-benefit`,
  `update-subscription`, `create-subscription`, e as quatro ações de
  fatura do cliente) revalidavam apenas as rotas antigas
  (`/dashboard/patients`, `/dashboard/plans`, `/dashboard/subscriptions`,
  `/dashboard/benefits`, `/dashboard/payments`) sem revalidar os destinos
  canônicos correspondentes (`/dashboard/clientes`, `/dashboard/planos`,
  `/dashboard/cobrancas`). Mantidas as chamadas antigas (inofensivas — a
  rota antiga continua existindo como redirecionamento) e adicionadas as
  novas.
- **Vocabulário**: os textos do diálogo de cliente que ainda diziam
  "paciente" (títulos, mensagens de sucesso/erro, confirmações de
  desativar/reativar/excluir) e os títulos/descrições mais visíveis do
  workspace do cliente (Resumo, negado, histórico) foram atualizados para
  "cliente", consistente com o restante da Fase 6. Breadcrumbs de
  `benefit-usage` e `payments` atualizados para "Atendimentos"/"Cobranças".

## Achado de regressão de permissão (corrigido)

A faixa de abas compartilhada criada na UI-066 (`MyCompanyTabs`) mostrava
as cinco abas (Perfil, Assinatura Sheep, Equipe, Recursos, Suporte)
**independente do papel do usuário** — um problema real de "atalho
enganoso": um usuário STAFF ou READ_ONLY que alcançasse a aba Suporte
(permitida) veria também links para Perfil/Assinatura/Equipe/Recursos, que
levariam a uma tela de acesso negado ao clicar. Corrigido: `MyCompanyTabs`
agora recebe o papel atual e filtra cada aba pelo mesmo recurso de RBAC
que a página de destino já usa (`clinic`, `users`, `modules`, `messages`).

Também foi encontrado e corrigido um atalho de Início ("Cobranças
pendentes") que aparecia para qualquer papel, incluindo quem não tem
permissão de `billing` — diferente do atalho vizinho "Cadastrar cliente",
que já era condicionado a `canManagePatients`. Agora usa a mesma
permissão exigida pela tela de destino.

## Fora do escopo (confirmado intocado)

- `features/crm/actions/convert-lead-to-patient.ts` revalida
  `/dashboard/patients` sem a rota canônica — não foi tocado por
  pertencer ao módulo CRM, fora do escopo permitido.
- Nenhuma Server Action ou serviço reutilizado foi removido; nenhuma
  regra de negócio foi alterada.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:rbac` — 5 cenários passaram.
- `pnpm test:membership` — 4 cenários passaram.
- `pnpm test:billing` — 14 cenários passaram.
- `pnpm test:users` — 4 cenários passaram.
- `pnpm test:modules` — 4 cenários passaram.
- `rg` final confirma que nenhum `href`/`redirect`/`router.push` interno
  do escopo empresa aponta mais para uma rota legada como destino final
  (os únicos resultados remanescentes são chamadas de `revalidatePath`
  para as rotas antigas, mantidas intencionalmente como redundância
  inofensiva).
- Playwright (build de produção, roteiro descartável após validação): os
  sete redirecionamentos legados de empresa (`patients`, `plans`,
  `benefit-usage`, `billing`, `payments`, `company?tab=assinatura`,
  `benefits`) chegam nas rotas canônicas corretas; um usuário STAFF criado
  para o teste tem Planos/Cobranças/Minha empresa ocultos na sidebar,
  ainda alcança Suporte por URL, mas a faixa de abas não oferece
  Perfil/Assinatura/Equipe/Recursos; uma tentativa direta de URL para uma
  aba sem permissão (`?tab=team`) mostra acesso negado; o atalho
  "Cobranças pendentes" não aparece mais para esse papel.

## Próxima task

UI-068 — QA Final: Simplicidade, Acessibilidade e Jornadas por Papel.
