# UI-014 - Administração de Clínicas — Relatório de Implementação

## Objetivo da task

Criar interface comercial para gestão dos clientes da plataforma. Listagem com clínica, plano SaaS, status, usuários, pacientes, assinatura, faturamento e ações. Formulário com dados cadastrais, telefone, CEP, cidade, UF, slug automático, plano, status e módulos. Detalhes com visão geral, usuários, módulos, cobrança SaaS, atividade e status. Critérios de aceite: saúde do cliente clara, filtros por status/plano, validações brasileiras, 100% pt-BR.

## Auditoria prévia

`ClinicTable` já usava os primitivos `Table`/`EmptyState`/`DataTableContainer`, mas o filtro de status e a busca ainda eram `<select>`/`<input>` crus, sem filtro de plano, e os badges de status (clínica e assinatura) usavam classes Tailwind fixas (`bg-emerald-100`, `bg-sky-100`...) em vez de `StatusIndicator`. A listagem também não trazia usuários nem faturamento — dados exigidos pela task mas ausentes tanto na tabela quanto no service `get-clinics.ts` (que só buscava `_count.patients`/`_count.membershipPlans`).

O formulário (`clinic-dialog.tsx`) já cobria corretamente cadastro, telefone/CEP/UF com máscaras brasileiras (`lib/br-formats.ts`) e slug automático (`buildUniqueClinicSlug`, usado quando o campo fica vazio), mas não exibia plano, status ou módulos em nenhum lugar.

A página de detalhes (`platform-clinic-details-page.tsx`) tinha duas tabelas HTML cruas (master da empresa e faturas/pagamentos), usava `formatEnumLabel` (humanizador em inglês, ex. "Past Due") em vez de tradução pt-BR para status de assinatura/pagamento, e não tinha aba de módulos — apesar de `ClinicModule` já existir no schema e de `ensureClinicModules()` já estar pronto em `features/modules/services/module-access.ts`.

Confirmei que gestão de módulos por clínica (habilitar/desabilitar) já existe em `ModulesPage`, mas opera sobre a clínica do usuário logado (`getCurrentClinicId()`), não sobre uma clínica arbitrária escolhida pela plataforma — e que, em V1, apenas o módulo Membership é ativável (os demais estão bloqueados como "reservados para expansões futuras" via `isModuleV1Active`). Também confirmei que só existe um plano SaaS comercial provisionado hoje (`ensureDefaultClinicBillingPlan`, "Sheep Growth" fixo) — não há seleção real de plano na criação de clínica.

## Arquivos criados

- `features/clinic/utils/clinic-status.ts` — `getClinicStatusTone`, `getClinicSubscriptionStatusTone`, `getPaymentStatusTone`, extraídos para reutilização entre a listagem, o diálogo de edição e a página de detalhes (evita duplicar a lógica de tom por status em 3 lugares).

## Arquivos modificados

- `features/clinic/services/get-clinics.ts` — passou a incluir `_count.appUsers` e `clinicInvoices` (pagas no mês corrente) para calcular `monthlyRevenue` por clínica.
- `features/clinic/services/get-platform-clinic-details.ts` — passou a retornar `clinicModules` (via `ensureClinicModules`) para alimentar a nova aba de módulos.
- `features/clinic/components/clinic-table.tsx` — reescrita: filtro de status e busca migrados para `Select`/`Input`; novo filtro de plano (`Select`, opções derivadas dos planos SaaS presentes na listagem); badges de status (empresa e assinatura) migrados para `StatusIndicator`; colunas alinhadas ao pedido da task (Empresa, Status, Plano SaaS, Assinatura, Usuários, Clientes, Faturamento, Ações); todo texto novo passou a usar `messages/pt-BR.json`.
- `features/clinic/components/clinic-row-actions.tsx` — tipo de `clinicSubscriptions[].status` corrigido de `string` solto para `ClinicSubscriptionStatus` (necessário para reutilizar os novos helpers de tom com segurança de tipos).
- `features/clinic/components/clinic-dialog.tsx` — nova seção somente-leitura "Status, plano e módulos" (modo edição, visão de plataforma): mostra status da empresa e status da assinatura via `StatusIndicator`, nome do plano SaaS atual, e um link para a aba de módulos da própria clínica. Não duplica as ações de ativar/desativar (permanecem na listagem) nem o CRUD de módulos (permanece em `ModulesPage`) — apenas dá visibilidade dentro do formulário, como pedido pela task.
- `features/clinic/components/platform-clinic-details-page.tsx` — as duas tabelas HTML cruas (master da empresa, faturas/pagamentos) migradas para o componente `Table` do design system; status de assinatura/fatura/pagamento migrados de `formatEnumLabel` para `StatusIndicator` + tradução `billing.status.*`; ações e entidades de auditoria migradas para os mapas já existentes `AUDIT_ACTION_LABELS`/`AUDIT_ENTITY_LABELS` (antes também usavam `formatEnumLabel` em inglês); nova aba **Módulos**, somente leitura, mostrando os 6 módulos e sua disponibilidade em V1.
- `messages/pt-BR.json` — novo namespace `clinics` (status da empresa, textos da tabela/filtros/vazio, textos da página de detalhes) para cobrir todo o texto novo introduzido nesta task.

## Decisões arquiteturais

- **Plano e módulos ficam somente-leitura no formulário de clínica.** A task pede que o formulário mostre "plano, status e módulos", mas as ações de troca de plano SaaS (fila de assinaturas, ainda sem UI dedicada) pertencem à UI-015 (Billing SaaS da Nortex), e a gestão de módulos por clínica já existe e pertence à UI-016 (Gestão de Módulos). Duplicar esses fluxos dentro do diálogo de clínica violaria a regra "não duplique lógica de negócio". Optei por exibir os três dados como informação clara (com `StatusIndicator` e um link para a área de módulos), preparando o terreno para as duas tasks seguintes sem antecipá-las.
- **"Saúde do cliente clara" não virou uma coluna nova.** Em vez de inventar um conceito de "saúde" isolado, a clareza vem da combinação de Status + Assinatura + Faturamento já exigida explicitamente pela task, cada um com seu próprio `StatusIndicator`.
- **Faturamento é calculado como soma das `ClinicInvoice` pagas no mês corrente**, mesmo padrão usado em `getBillingOverview()`/dashboards anteriores (UI-004/UI-012) para receita mensal — evita inventar uma métrica nova.
- **Migração de `formatEnumLabel` para tradução pt-BR real** nos status de assinatura/fatura/pagamento e nas ações/entidades de auditoria da página de detalhes: fora do escopo literal da task, mas diretamente relacionado ao critério de aceite "100% pt-BR" — a página estava mostrando texto em inglês (ex. "Past Due", "Initial Nortex platform invoice" é dado de seed, não alterado).
- **`ClinicQuickViewPanel` (visão rápida via ícone de olho) não foi alterada.** Ela é um preview leve já adequado; a página de Detalhes é o lugar formalmente pedido pela task para visão geral/usuários/módulos/cobrança/atividade/status.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 28 rotas geradas.
- `pnpm test:tenant` — ✅ os 11 cenários de isolamento entre tenants (inclui clínica/billing/contracts).
- `pnpm test:modules` — ✅ os 4 cenários (apenas Membership ativo em V1, módulos futuros bloqueados, staff sem permissão de gestão).
- `pnpm test:rbac` — ✅ os 5 cenários.
- `pnpm test:billing` — ✅ os 7 cenários (inclui transições de assinatura SaaS e faturas da clínica).
- **Verificação em navegador (Playwright)**, autenticado como `owner+workspace@membership-core.local` (plataforma, sem `clinicId`):
  - Listagem `/dashboard/clinics`: 4 contas exibidas, colunas na ordem Empresa/Status/Plano SaaS/Assinatura/Usuários/Clientes/Faturamento/Ações; filtros "Filtro de status" e "Filtro de plano" renderizados como `Select`; badges com tons corretos (`Ativa`/verde, `Teste`/azul, `Cancelado`/vermelho, `Em atraso`/âmbar).
  - Diálogo de edição: nova seção "Status, plano e módulos" visível com status da empresa, plano/assinatura e link para módulos.
  - Detalhes da clínica (`/dashboard/clinics/[id]`): aba **Módulos** nova exibe os 6 módulos (Membership ativo/disponível; CRM, Scheduling, Communication, Patient Portal, Analytics inativos/reservados); aba **Pagamentos** mostra a tabela de faturas migrada para o componente `Table`, com status traduzido; aba **Usuários** mostra a tabela do master da empresa migrada, com colunas Nome completo/E-mail/Status/Último acesso/Troca obrigatória.
  - 0 erros de console nas passagens majoritárias; uma execução isolada (1 de 4 rodadas) registrou um aviso de hydration mismatch do React relacionado a `style={{caret-color:"transparent"}}` no campo de busca — não reproduzido de forma consistente, não ligado a nenhuma lógica condicional no código desta task (sem `Date.now()`/`Math.random()`/branch client-only), e ausente do mesmo padrão de `Input` já em produção em `patients-table.tsx`. Registrado aqui como observação para acompanhamento, não como regressão confirmada.

## Trabalho remanescente

- Seleção real de plano SaaS na criação de clínica e edição de assinatura: pertence à UI-015.
- Habilitar/desabilitar módulos de uma clínica a partir da visão de plataforma (hoje só o próprio workspace da clínica gerencia seus módulos): pertence à UI-016.

## Riscos

- Baixo: nenhuma Server Action nem regra de negócio foi alterada — apenas leitura adicional (`_count.appUsers`, `clinicInvoices`, `ensureClinicModules`) e camada de apresentação. `ensureClinicModules` já era usado em produção por `ModulesPage`; reutilizá-lo aqui em modo leitura não introduz efeito colateral novo.

## Próxima task sugerida

`UI-015-saas-billing.md`.
