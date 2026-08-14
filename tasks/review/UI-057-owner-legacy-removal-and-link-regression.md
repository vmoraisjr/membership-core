# UI-057 — Retirada das Entradas Legadas e Regressão de Links Owner — Relatório de Implementação

## Objetivo

Encerrar a migração das UI-049 a UI-056 sem deixar caminhos paralelos,
painéis redundantes ou links internos que devolvam o owner ao antigo
labirinto de rotas.

## Metodologia

Auditoria em duas fases:
1. Uma busca ampla (agente Explore) por toda ocorrência de string das 7
   rotas legadas (`/dashboard/clinics`, `/dashboard/billing*`,
   `/dashboard/modules`, `/dashboard/users`, `/dashboard/audit-logs`,
   `/dashboard/messages`) como alvo de navegação (`href`,
   `router.push`, `redirect()`), classificando cada ocorrência como
   plataforma vs. clínica e como bug real vs. uso correto.
2. Uma segunda varredura manual, motivada pelo padrão de bug já visto 3
   vezes nesta fase (UI-053, UI-055, UI-056): toda `safeRevalidatePath`
   de uma action **exclusivamente de plataforma** que só revalida a
   rota legada, nunca a rota canônica de onde a mutação é hoje
   disparada.

## Bugs reais encontrados e corrigidos

### Links de navegação (5)

1. `clinic-quick-view-panel.tsx` — "Abrir workspace completo" apontava
   para `/dashboard/clinics/${clinic.id}`. Painel só é renderizado para
   `isPlatformView`. → `empresaUrl(clinic.id)`.
2. `clinic-row-actions.tsx` — mesmo botão (ícone externo) na tabela de
   empresas, mesmo problema, mesma correção.
3. `clinic-dialog.tsx` — "Ver módulos desta empresa" (bloco só visível
   em `mode === "edit" && isPlatformView`) apontava para
   `/dashboard/clinics/${id}?tab=modules`. →
   `empresaUrl(id, { tab: "modules" })`.
4. `modules-page.tsx` — "Ver catálogo comercial" (ramo `!clinicId` do
   componente `ModulesPage`, que é exatamente o que a rota canônica
   `/dashboard/planos-comerciais?tab=modules` renderiza) apontava para
   `/dashboard/billing/catalog`. → `planosComerciaisUrl({ tab: "plans"
   })`. Ou seja: a própria página canônica linkava de volta para a
   rota legada.
5. `platform-commercial-catalog-page.tsx` — os dois links "Limpar"
   (barra de filtro e estado vazio) apontavam para
   `/dashboard/billing/catalog`, mesmo esse componente sendo o que
   `/dashboard/planos-comerciais?tab=plans` renderiza. Mesma correção.

### Redirect legado apontando para outro legado (1)

6. `app/(dashboard)/dashboard/billing/page.tsx` — a rota `/dashboard/billing`
   (sem sufixo) redirecionava plataforma para `/dashboard/billing/catalog`
   (outro legado) em vez de ir direto ao canônico. →
   `planosComerciaisUrl({ tab: "plans" })`.

### Cache não revalidava a rota canônica (8 actions)

Mesma classe de bug corrigida em UI-053 (billing)/UI-055 (chamados)/
UI-056 (equipe Sheep), agora nas actions de módulo, plano comercial e
CRUD de empresa:

- `platform-set-clinic-module-status.ts` — só revalidava
  `/dashboard/clinics/${clinicId}` (rota morta, nunca renderiza nada) e
  `/dashboard/modules` (inacessível a quem chama essa action, que é
  sempre plataforma). Trocado por
  `safeRevalidatePath(\`/dashboard/empresas/${clinicId}\`)` — a aba
  Módulos do workspace é exatamente de onde a ação é disparada.
- `save-clinic-billing-plan.ts` (editar/criar plano comercial) — nunca
  revalidava `/dashboard/planos-comerciais`, a própria tela de onde o
  diálogo é aberto. Adicionado, junto com `/dashboard/empresas` (a
  listagem também mostra o plano por empresa).
- `create-clinic.ts`, `update-clinic.ts`, `deactivate-clinic.ts`,
  `reactivate-clinic.ts`, `reset-clinic-master-password.ts` — as 5
  actions centrais de CRUD de empresa só revalidavam
  `/dashboard/clinics` (lista legada). Nenhuma revalidava
  `/dashboard/empresas` (lista canônica) nem `/dashboard/empresas/{id}`
  (workspace) — as mais usadas da Fase 4 inteira, e o bug mais
  impactante encontrado nesta task. Todas as 5 agora também revalidam
  `/dashboard/empresas` e, quando o `id`/`clinicId` já está disponível
  no escopo, `/dashboard/empresas/{id}`.
  - Exceção deliberada: `update-clinic-branding.ts` usa
    `getCurrentClinicId()` — é self-service de clínica (edição da
    própria marca, rota `/dashboard/company`), nunca chamada pela
    plataforma para uma empresa arbitrária. Não alterada.

## Limpeza de UI legada morta

- Removidos `features/billing/components/platform-saas-subscriptions-page.tsx`,
  `platform-saas-payments-page.tsx` e `saas-subscription-details-panel.tsx` —
  confirmados via grep no repositório inteiro como não importados por
  nenhuma rota: `/dashboard/billing/subscriptions` e
  `/dashboard/billing/payments` já redirecionavam direto para
  `empresaUrl`/`empresasUrl` desde a UI-049/053 sem nunca renderizar
  esses componentes; a aba "Plano e cobrança" do workspace usa
  `CompanyBillingTab` (UI-053). Satisfaz o critério do backlog
  ("remover da UI as antigas telas globais de Assinaturas SaaS e
  Pagamentos SaaS") — eram código morto, não apenas rota inacessível.

## Arquivos modificados

- `features/clinic/components/clinic-quick-view-panel.tsx`
- `features/clinic/components/clinic-row-actions.tsx`
- `features/clinic/components/clinic-dialog.tsx`
- `features/modules/components/modules-page.tsx`
- `features/billing/components/platform-commercial-catalog-page.tsx`
- `app/(dashboard)/dashboard/billing/page.tsx`
- `features/modules/actions/platform-set-clinic-module-status.ts`
- `features/modules/actions/save-clinic-billing-plan.ts`
- `features/clinic/actions/create-clinic.ts`
- `features/clinic/actions/update-clinic.ts`
- `features/clinic/actions/deactivate-clinic.ts`
- `features/clinic/actions/reactivate-clinic.ts`
- `features/clinic/actions/reset-clinic-master-password.ts`

## Arquivos removidos

- `features/billing/components/platform-saas-subscriptions-page.tsx`
- `features/billing/components/platform-saas-payments-page.tsx`
- `features/billing/components/saas-subscription-details-panel.tsx`

## Fora do escopo (não alterado)

- Nenhuma migration, Server Action ainda reutilizada ou URL externa
  publicada foi removida.
- `revalidatePath` para rotas legadas (`/dashboard/billing/*`,
  `/dashboard/clinics`) foi **mantido** ao lado dos novos — são
  gratuitos e mantêm as rotas de compatibilidade também frescas caso
  alguém as acesse antes de ser redirecionado; só o que faltava
  (canônico) foi adicionado.
- `update-clinic-branding.ts` não alterada (self-service de clínica,
  já explicado acima).

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `rg` para as 7 rotas legadas como string de navegação — nenhuma
  ocorrência restante fora de: (a) as próprias rotas de compatibilidade
  redirecionando (esperado), (b) `safeRevalidatePath` de cache
  (esperado, não é navegação), (c) links self-service de clínica para
  suas próprias rotas (esperado).
- `pnpm test:tenant` — ✅ 11 cenários, sem regressão.
- `pnpm test:rbac` — ✅ 5 cenários, sem regressão.
- `pnpm test:billing` — ✅ 7 cenários, sem regressão.
- `pnpm test:modules` — ✅ 4 cenários, sem regressão.
- `pnpm test:users` — ✅ 4 cenários, sem regressão.
- `pnpm test:audit` — ✅ 8 cenários, sem regressão.
- Playwright contra build de produção, login real como Owner Operator:
  - `/dashboard/empresas` → ação de linha "Abrir workspace completo" →
    `/dashboard/empresas/{id}` (confirmado por href e navegação real).
  - `/dashboard/planos-comerciais?tab=modules` → "Ver catálogo
    comercial" → `href="/dashboard/planos-comerciais?tab=plans"`
    (antes: `/dashboard/billing/catalog`).
  - `/dashboard/planos-comerciais?tab=plans` com filtro sem resultado →
    "Limpar" → `href="/dashboard/planos-comerciais?tab=plans"` (antes:
    `/dashboard/billing/catalog`).
  - `/dashboard/billing` (bare) → `/dashboard/planos-comerciais?tab=plans`
    diretamente (antes: bounce por `/dashboard/billing/catalog`).
  - Diálogo "Editar empresa" → "Ver módulos desta empresa" →
    `href="/dashboard/empresas/{id}?tab=modules"` (antes:
    `/dashboard/clinics/{id}?tab=modules`).
  - Workspace da empresa renderiza as 6 abas completas (Resumo, Plano e
    cobrança, Pessoas, Módulos, Chamados, Auditoria) — confirma que as
    UI-053 a UI-055 estão todas integradas no mesmo destino canônico.

## Critérios de aceite

- ✅ Não há entrada lateral nem link interno owner para `billing/catalog`,
  `billing/subscriptions`, `billing/payments`, `modules` (platform),
  `users`, `audit-logs`, `messages` (platform) ou `clinics` como
  destinos finais — confirmado pela varredura + Playwright.
- ✅ Todas essas rotas legadas chegam ao contexto canônico certo sem
  perder a empresa/filtro selecionado — já garantido pelas tasks
  anteriores (UI-049/053/055/056) e reconfirmado aqui sem regressão.
- ✅ Uma ação de empresa é concluída no workspace ou Planos comerciais,
  sem atravessar uma lista global desnecessária — os 8 fixes de
  revalidação garantem que o resultado da ação aparece na tela onde ela
  foi disparada, sem exigir navegação extra para "ver se funcionou".

## Riscos

- Baixo: todas as mudanças de link são substituições diretas de string
  fixa por chamada de helper (`empresaUrl`/`planosComerciaisUrl`) — sem
  mudança de lógica condicional.
- Baixo: as 8 correções de revalidação são estritamente aditivas
  (nenhuma chamada existente removida, exceto as duas que apontavam
  para rotas mortas/inacessíveis em `platform-set-clinic-module-status.ts`,
  que não tinham efeito prático).
- Baixo: a remoção dos 3 componentes órfãos foi confirmada por grep no
  repositório inteiro antes da exclusão — nenhum importador restante,
  nenhuma referência em testes ativos.

## Próxima task

`UI-058-owner-navigation-density-qa.md` — QA final, seguindo em
sequência.
