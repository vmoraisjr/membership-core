# Auditoria do Frontend — UI-000

## Status

Referente à task `tasks/backlog/UI-000-frontend-audit.md`. Levantamento somente leitura, nenhum código foi alterado. Escopo: todas as rotas ativas de `apps/web/app`, as ~18 features de `apps/web/features/`, o shell (`components/layout/*`), a biblioteca compartilhada (`components/dashboard/*`, `components/ui/*`, `features/shared/*`) e os fluxos críticos ponta a ponta.

## Legenda de classificação

- **Manter** — estrutura e apresentação já seguem os padrões corretos; não é alvo prioritário de redesign.
- **Redesenhar** — lógica/estrutura corretas, mas a camada visual precisa ser refeita com o Design System Sheep (UI-001).
- **Substituir** — implementação atual usa markup cru (HTML puro) ou padrão fora do design system a ponto de exigir reconstrução, não apenas reskin.
- **Consolidar** — existe duplicação/paralelismo com outra tela ou componente; a ação correta é unificar antes ou durante o redesign.
- **Remover da navegação V1** — rota órfã, inalcançável ou que expõe módulo fora de escopo V1; deve ser desconectada da navegação ativa (código pode permanecer).

---

## 1. Inventário de telas ativas

### 1.1 Autenticação — `app/(auth)/*`

| Rota | Arquivo | Classificação | Justificativa |
|---|---|---|---|
| `/login` | `features/auth/components/login-form.tsx` | Redesenhar | Único fluxo de auth que já usa `Field`/`Input`/`PasswordInput`/`Button` do design system; precisa apenas de reskin visual. |
| `/first-access` | `app/(auth)/first-access/page.tsx` | Substituir | Formulário 100% HTML cru (`<input>`/`<button>`), sem componentes do design system. |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Substituir | Mesma situação de `/first-access`. |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | Substituir | Mesma situação de `/first-access`. |
| `/invite` | `app/(auth)/invite/page.tsx` | Substituir | Mesma situação de `/first-access`. |

As quatro páginas acima também devem ser **consolidadas**: repetem literalmente o mesmo shell (`<main>`/`<div>` centralizado) sem um componente `AuthCard`/`AuthLayout` compartilhado. Recomenda-se extrair esse shell como parte da UI-003.

### 1.2 Dashboard (home) — `/dashboard`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard` (`DashboardHomePage`) | Redesenhar | Já usa `PageHeader`, `SectionCard`, `MetricGrid`/`MetricCard`, `ActionCard`. Estrutura correta, precisa de reskin e possivelmente novos indicadores. |

### 1.3 Clínicas / Empresa — `clinic`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/clinics` (`ClinicPage`) | Redesenhar | `ClinicTable` já usa `Table`/`EmptyState`/`DataTableContainer`. |
| `/dashboard/clinics/[clinicId]` (`PlatformClinicDetailsPage`) | Substituir | Sub-tabelas (master, pagamentos, timeline) usam `<table>` HTML cru com `overflow-x-auto` manual em vez de `components/ui/table.tsx`. |
| `/dashboard/company` (`CompanyProfilePage`) | Redesenhar | `CompanyBrandingForm` já segue o padrão de formulário com `FormSection`. |

`features/billing/components/clinic-invoice-actions.tsx` e `clinic-subscription-actions.tsx` não são importados em nenhum lugar do app — candidatos a **remoção** (código morto), a confirmar durante a UI-004.

### 1.4 Planos de associação — `membership-plans`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/plans` (`MembershipPlansPage`) | Redesenhar | Tabela e dialog seguem o padrão (`Table`/`EmptyState`/`DataTableContainer`/`Dialog`), mas filtro de status usa `<select>` cru e `MembershipPlanRowActions` tem strings hardcoded em inglês (débito de i18n a corrigir junto do redesign). |

### 1.5 Benefícios — `membership-benefits`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/benefits` (`MembershipBenefitsPage`) | Redesenhar | Estrutura de componentes correta, mas toda a feature (tabela, dialog, row-actions) está 100% fora do i18n — deve ser migrada para `messages/pt-BR.json` durante o redesign, e os 3 filtros `<select>`/`<input>` crus devem virar `Select`/`Input` do design system. |

### 1.6 Pacientes — `patients`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/patients` (`PatientsPage`) | Manter | Feature mais madura: `Table`/`EmptyState`/`DataTableContainer`, `Dialog`, `ConfirmDialog`, i18n consistente. Referência de padrão para as demais. |
| `/dashboard/patients/[patientId]` (`PatientProfilePage`) | Substituir | Todas as 6 sub-tabelas (`SectionCard`s de identidade, assinaturas, uso de benefício, pagamentos, contratos, timeline) usam `<table>` HTML cru, sem `EmptyState` padronizado. |

### 1.7 Assinaturas — `subscriptions`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/subscriptions` (`SubscriptionsPage`) | Redesenhar | Estrutura correta, mas `SubscriptionsTable` usa um bloco de estado vazio manual em vez de `EmptyState` — alinhar ao padrão durante o redesign. |

### 1.8 Uso de benefícios — `benefit-usage`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/benefit-usage` (`BenefitUsageHistoryPage`) | Substituir | Único cancelamento destrutivo do app feito com `<button>` cru sem `ConfirmDialog`; feature 100% fora do i18n (mistura inglês/pt-BR hardcoded). Requer reconstrução, não apenas reskin. |

### 1.9 Cobrança/Pagamentos — `billing`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/billing` (`BillingPage`) | Substituir + Consolidar | Contém ~530 linhas de branch de plataforma inalcançável (ver §3.1) e um branch de clínica quase idêntico a `PatientPaymentsPage` (tabela `<table>` cru, helpers de status duplicados). |
| `/dashboard/billing/catalog` (`PlatformCommercialCatalogPage`) | Redesenhar | Já usa `Table`/`EmptyState`/`DataTableContainer`/`SidePanel`. |
| `/dashboard/billing/subscriptions` (`PlatformSaasSubscriptionsPage`) | Redesenhar | Mesmo padrão do catálogo. |
| `/dashboard/billing/payments` (`PlatformSaasPaymentsPage`) | Redesenhar | Ações via `<form action>` nativo sem `ConfirmDialog`/toast — padronizar com o fluxo client (`useTransition`) usado em `PatientInvoiceActions`. |
| `/dashboard/payments` (`PatientPaymentsPage`) | Substituir + Consolidar | Tabela `<table>` cru; helpers duplicados com o branch clínica de `BillingPage` (ver §1.9 acima). |

### 1.10 Módulos — `modules`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/modules` | **Remover da navegação V1** | A rota sempre redireciona para `/dashboard/billing` sem renderizar `ModulesPage`. `features/modules/components/modules-page.tsx` (625 linhas) e `PlatformSubscriptionSection` são código órfão, não referenciado por nenhuma rota nem pela sidebar. Confirmar remoção formal do roteamento morto na UI-016, preservando o código-fonte conforme regra de não deletar lógica de negócio sem necessidade. |

### 1.11 Usuários — `users`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/users` (`UsersPage`) | Consolidar + Substituir | `UsersOverviewPanel` (clínica, `<table>` cru) e `PlatformUsersOverviewPanel` (plataforma, `Table`/`DataTableContainer`) reimplementam em paralelo os mesmos helpers (`getRoleLabelFromValue`, `getUserStatusLabel`, etc.) e o dialog de edição embutido. Consolidar em um único conjunto de componentes antes/durante o redesign (UI-013). |

### 1.12 RBAC — `features/rbac`

Sem rota própria. `AccessDenied` (`features/rbac/components/access-denied.tsx`) é o único estado de erro de permissão padronizado do app — **Manter** a lógica, redesenhar visualmente junto do UI-018 (estados globais).

### 1.13 Auditoria — `audit-log`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/audit-logs` (`AuditLogPage`) | Redesenhar | Já usa `Table`/`EmptyState`/`DataTableContainer`/`SidePanel`; mistura `<select>` cru com `Input` do design system nos filtros. |
| `/dashboard/audit-logs/export` (route handler) | Manter | Rota de exportação CSV, sem UI. Observação: lógica de `escapeCsvValue`/`formatMetadata` duplicada com `audit-log-table.tsx` (débito técnico, fora do escopo visual). |

### 1.14 Mensagens — `messages`

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/messages` (`SupportThreadsPage`) | Substituir | Página monolítica (518 linhas), lista+detalhe em grid próprio, helpers de label 100% locais e hardcoded (fora do i18n). |

### 1.15 Contratos — `contracts` (dormente)

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/contracts` (`ContractsPage`) | **Remover da navegação V1** | Já está fora do menu lateral, mas a rota permanece acessível via URL direta para qualquer usuário de clínica com permissão `view` (não há `notFound()` como no CRM). Recomenda-se aplicar o mesmo bloqueio hard usado em `/dashboard/crm` para fechar essa inconsistência de ocultação — decisão a validar com o time antes da execução, pois envolve rota/comportamento, não só visual. |

### 1.16 CRM — `crm` (dormente)

| Rota | Classificação | Justificativa |
|---|---|---|
| `/dashboard/crm` | Manter (como está) | Já bloqueada corretamente via `notFound()` com comentário explícito de intenção. Nenhuma ação necessária — confirma que o padrão de ocultação correto é este, não o usado em Contracts. |

---

## 2. Shell e biblioteca compartilhada

| Item | Classificação | Justificativa |
|---|---|---|
| `components/layout/dashboard-sidebar.tsx` | Redesenhar | Filtragem por `hasPermission` e flags `platformOnly`/`clinicOnly` corretas; falta suporte mobile (sem drawer/hambúrguer — ver §4). Alvo da UI-002. |
| `components/layout/dashboard-header.tsx` | Redesenhar | Estrutura correta (server component), reskin necessário. |
| `components/layout/breadcrumb-trail.tsx` | Redesenhar + débito i18n | Usa um dicionário `SEGMENT_LABELS` paralelo em vez de `messages/pt-BR.json`. |
| `components/dashboard/page-header.tsx`, `section-card.tsx`, `metric-card.tsx`/`metric-delta.tsx`/`metric-grid.tsx`, `empty-state.tsx`, `data-table-container.tsx`, `confirm-dialog.tsx` | Manter (lógica) / Redesenhar (visual) | São os primitivos reais de página do produto e já são amplamente reutilizados; base sólida para a UI-001 (design tokens) e reskin subsequente. |
| `components/dashboard/table-actions.tsx` | **Candidato a remoção** | Não é referenciado por nenhuma tabela real; cada feature reimplementa suas próprias row-actions. Confirmar se será adotado (unificando ações) ou removido durante a UI-001/UI-002. |
| `components/dashboard/confirm-submit-button.tsx` | **Candidato a remoção** | Só usado por `modules-page.tsx`, que é código órfão (ver §1.10). |
| `components/ui/select.tsx` | **Substituir usos crus** | Componente existe e é correto, mas nunca é importado — 47 ocorrências de `<select>` HTML cru em 23 arquivos deveriam usá-lo. Prioridade alta na UI-001 por ser transversal a quase toda tela com filtro/formulário. |
| `components/ui/dropdown-menu.tsx` | **Adotar** | Existe mas nunca é usado; nenhuma tabela consolida ações em menu suspenso — todas usam N botões-ícone lado a lado sem `flex-wrap`, o que agrava a falta de responsividade das tabelas (ver §4). Recomenda-se adoção já na UI-002/UI-001 como padrão de row-actions. |
| `components/ui/side-panel.tsx` vs `components/ui/dialog.tsx` | Definir critério | Dois padrões de overlay coexistem sem critério documentado (Dialog: patients/plans/benefits/subscriptions/benefit-usage; SidePanel: clinic, billing/platform, audit-log). Decisão de design a fixar na UI-001. |
| `features/shared/*` | Manter | Apenas 2 arquivos (`render-clinic-scoped-page.tsx`, `format-date-for-input.ts`), ambos utilitários corretos e usados; não é a "biblioteca compartilhada" de UI — isso vive de fato em `components/dashboard/*`. Nenhuma ação necessária além de documentar essa organização real para as próximas tasks. |

---

## 3. Duplicações e código morto identificados

Lista consolidada (com caminhos), para orientar a ordem de execução das próximas tasks:

1. **Código morto (~530 linhas)**: branch `!currentUser?.clinicId` em `features/billing/components/billing-page.tsx` (linhas ~116–649), inalcançável porque `app/(dashboard)/dashboard/billing/page.tsx` já redireciona antes. Duplica `platform-commercial-catalog-page.tsx` + `platform-saas-subscriptions-page.tsx` + `platform-saas-payments-page.tsx`.
2. **Rota e página órfãs (625 linhas)**: `features/modules/components/modules-page.tsx`, não referenciada por nenhuma rota nem pela sidebar; `/dashboard/modules` redireciona sempre para `/dashboard/billing`.
3. **Componentes órfãos**: `features/billing/components/clinic-invoice-actions.tsx`, `clinic-subscription-actions.tsx`, `features/billing/components/platform-subscription-section.tsx` (só usado pelo `modules-page.tsx` órfão), `components/dashboard/table-actions.tsx`.
4. **Painéis de usuários quase-duplicados**: `features/users/components/users-overview-panel.tsx` (873 linhas) vs `platform-users-overview-panel.tsx` (904 linhas) — mesmos helpers reimplementados em paralelo.
5. **`billing-page.tsx` (branch clínica) vs `patient-payments-page.tsx`**: tabela de `patientInvoices` e helpers de status/label copiados quase literalmente entre os dois arquivos.
6. **Dois padrões de tabela**: `components/ui/table.tsx` vs `<table>` HTML cru em 9 arquivos (`patient-profile-page.tsx`, `billing-page.tsx`, `patient-payments-page.tsx`, `platform-subscription-section.tsx`, `platform-clinic-details-page.tsx`, `contracts-page.tsx`, `modules-page.tsx`, `users-overview-panel.tsx`, `audit-log-details-side-panel.tsx`).
7. **`EmptyState` usado de forma inconsistente**: ausente em `subscriptions-table.tsx` e em todas as sub-tabelas com `<table>` cru.
8. **Dois padrões de overlay** (`Dialog` vs `SidePanel`) sem critério documentado.
9. **`select` e `dropdown-menu` do design system nunca usados** — substituídos por markup cru em 23+ arquivos.
10. **4 páginas de auth quase idênticas** sem shell compartilhado (`AuthCard`/`AuthLayout` inexistente).
11. **i18n fragmentado** — `membership-benefits`, `benefit-usage`, `clinic` (parcial), `contracts`, `messages`, `modules` e o branch platform de `billing` estão total ou parcialmente fora de `messages/pt-BR.json`; `membership-plan-row-actions.tsx` e `membership-benefit-row-actions.tsx` têm strings hardcoded em **inglês**.
12. **Ocultação inconsistente de módulos dormentes V1**: CRM bloqueado via `notFound()`; Contracts apenas ausente do menu, mas rota acessível.

---

## 4. Sinais de responsividade

- O shell (`.app-shell` em `app/globals.css`) só vira layout de 2 colunas a partir do breakpoint `lg`; abaixo disso o sidebar completo (todos os itens de navegação) aparece empilhado por extenso acima do conteúdo — **não há drawer/off-canvas mobile nem hambúrguer**.
- O toggle de collapse do sidebar só tem efeito de layout em `lg+`.
- Estratégia de tabelas é exclusivamente scroll horizontal (`overflow-x-auto`); não há colapso de colunas nem visão em cartão para mobile, nem componentes `*-mobile.tsx`/`useMediaQuery`.
- Row-actions usam `flex items-center gap-2` sem `flex-wrap`; linhas com até 5 botões (ex.: `PatientRowActions`) dependem inteiramente do scroll horizontal — a adoção de `DropdownMenu` (já disponível, nunca usado) resolveria isso.
- Classes responsivas (`md:grid-cols-*`, `xl:grid-cols-*`) são usadas de forma consistente em grids de métricas, skeletons e formulários — o problema de responsividade está concentrado no shell (sidebar) e nas tabelas, não nos formulários/dialogs.

Este ponto é escopo direto da UI-019 (responsividade/acessibilidade), mas o shell (UI-002) e o padrão de tabela (UI-001) precisam resolver a base antes.

---

## 5. Fluxos críticos mapeados

Fluxos traçados ponta a ponta (arquivos envolvidos, sem julgamento — ver relatório de exploração para detalhe completo por arquivo):

1. **Login → Dashboard**: `login/page.tsx` → `LoginForm` → `loginAction` → `authenticate-app-user.ts`/`create-auth-session.ts` → `app/(dashboard)/layout.tsx` → `DashboardSidebar`/`DashboardHeader` → `DashboardHomePage`.
2. **Criação de paciente**: `PatientsPage` → `PatientDialog` (`Dialog` + RHF + Zod) → `ConfirmDialog` → `createPatient` → toast (sonner) → `PatientsTable`/`PatientRowActions`.
3. **Criação de assinatura**: dois pontos de entrada (`SubscriptionsPage` e `PatientRowActions`) → `SubscriptionDialog` (cálculo automático de `expiresAt`) → `ConfirmDialog` → `createSubscription` → toast → `SubscriptionsTable`.
4. **Uso de benefício**: dois pontos de entrada (`BenefitUsageHistoryPage` e `PatientRowActions`) → `ConsumeBenefitDialog` → `consumeBenefit`/`validate-benefit-usage.ts` → toast → `BenefitUsageTable` (cancelamento sem confirmação, ver §1.8) e histórico no perfil do paciente.
5. **Pagamento/fatura**: lado clínica (`PatientPaymentsPage` → `PatientInvoiceActions`, client com `useTransition`+`ConfirmDialog`) duplicado no branch clínica de `BillingPage`; lado plataforma (`PlatformSaasPaymentsPage` → `PaymentAttentionBar`) usa `<form action>` nativo sem confirmação/toast, padrão diferente do lado paciente.

Nenhuma regra de negócio, Server Action, tenant isolation ou RBAC precisa mudar nesses fluxos — o redesign deve preservar exatamente esses caminhos de dados, alterando apenas a camada de apresentação, conforme regra permanente da UI-000.

---

## 6. Ordem recomendada de substituição

A ordem já definida em `tasks/backlog/README-FRONTEND.md` (UI-001 → UI-020) está alinhada com os achados desta auditoria e é a ordem recomendada:

1. **UI-001 (Design System)** deve primeiro fixar: tokens de cor/espaçamento, critério `Dialog` vs `SidePanel`, adoção obrigatória de `Select`/`DropdownMenu` do design system (item transversal de maior impacto, presente em 23+ arquivos) e um componente `AuthCard`/`AuthLayout`.
2. **UI-002 (Shell/Navegação)** deve resolver o comportamento mobile do sidebar (drawer/hambúrguer) antes de qualquer tela de listagem ser redesenhada, já que toda tela depende do shell.
3. **UI-003 (Auth)** substitui as 4 páginas de auth cruas, reaproveitando o padrão já correto do `LoginForm`.
4. **UI-004–UI-012** (dashboard, patients, plans, benefits, benefit-usage, subscriptions, payments) devem, nesta ordem, padronizar tabela (`components/ui/table.tsx` em vez de `<table>` cru), `EmptyState` e `ConfirmDialog` — com atenção especial a `benefit-usage` (ausência de confirmação) e `patient-profile-page.tsx`/`billing-page.tsx`/`patient-payments-page.tsx` (maior concentração de `<table>` cru e lógica duplicada, ver §3, itens 1 e 5).
5. **UI-013 (Usuários)** deve consolidar `users-overview-panel.tsx` e `platform-users-overview-panel.tsx` antes ou durante o reskin, para não redesenhar duas implementações divergentes em paralelo.
6. **UI-014 (Clínicas admin)** deve resolver as sub-tabelas cruas de `platform-clinic-details-page.tsx` e decidir o destino dos componentes órfãos `clinic-invoice-actions.tsx`/`clinic-subscription-actions.tsx`.
7. **UI-015 (SaaS billing)** deve remover/consolidar o branch morto de `billing-page.tsx` (~530 linhas) como parte do trabalho, não apenas reskinar por cima dele.
8. **UI-016 (Modules)** deve formalizar a remoção de `/dashboard/modules` da navegação (já é redirect morto) e decidir o destino de `modules-page.tsx`/`platform-subscription-section.tsx` órfãos.
9. **UI-017 (Audit log)** é redesign direto, sem duplicações relevantes.
10. **UI-018 (Estados globais)** deve padronizar `EmptyState`/loading/erro nos pontos identificados no §3 (item 7) e revisar `AccessDenied`.
11. **UI-019 (Responsividade/acessibilidade)** depende da adoção de `DropdownMenu` para row-actions (§4) e do trabalho de shell da UI-002.
12. **UI-020 (Prontidão comercial)** é a validação final; deve reconfirmar que Contracts continua tratado como dormente (ou formalizar o bloqueio via `notFound()`, se essa decisão for tomada) e que `messages` está documentado como módulo ativo (gap já registrado fora desta task, ver observação abaixo).

Fora da ordem numerada, mas relevante para qualquer task que toque `messages`/`contracts`/`billing`: alinhar i18n (§3, item 11) junto do redesign de cada tela, não como task separada — a regra permanente exige que todo texto novo use `messages/pt-BR.json`, e várias telas já teriam esse débito mesmo antes do redesign visual.

---

## 7. Observações fora do escopo desta task

- A pasta `packages/` do monorepo está vazia — não há pacote de design system compartilhado hoje; a UI-001 provavelmente criará os tokens dentro de `apps/web` (`app/globals.css`/`tailwind.config`), não em um pacote novo, a menos que decidido explicitamente.
- O módulo `messages` está ativo em produção (rota, RBAC e testes existem) mas não consta em `docs/ai-context.md`; isso é um gap de documentação, não de frontend, e não bloqueia a UI-000, mas deve ser corrigido para que as próximas tasks tratem `messages` como módulo V1 de fato.
- Nenhuma rota, Server Action, schema Zod ou regra de tenant/RBAC foi alterada durante este levantamento.
