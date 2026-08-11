# UI-004 - Dashboard Executivo da Clínica — Relatório de Implementação

## Objetivo da task

Transformar o dashboard em cockpit operacional: saudação, clínica, período e ação contextual; KPIs (pacientes ativos, assinaturas ativas, receita mensal, cobranças em atraso, benefícios utilizados); blocos de evolução de receita, assinaturas por status, vencimentos próximos, atividades recentes, alertas e atalhos. Sem métricas fictícias, com tenant e RBAC preservados.

## Auditoria prévia

`DashboardHomePage` já era a tela mais madura do conjunto: já usava `PageHeader`/`SectionCard`/`MetricGrid`/`MetricCard`/`ActionCard`, já cobria as 5 métricas pedidas (`activePatients`, `activeSubscriptionsCount`, `monthlyPatientRevenue`, `overduePatientInvoices`, `benefitsConsumed`) e já tinha blocos de "o que merece atenção" e atalhos, tanto para clínica quanto para plataforma. Faltavam, especificamente: saudação personalizada, indicador de período, ação contextual no cabeçalho, e os 4 blocos "evolução de receita", "assinaturas por status", "vencimentos próximos" e "atividades recentes" — nenhum dos quatro existia, e nenhum service de dashboard os calculava.

## Arquivos criados

- `features/dashboard/services/get-subscription-status-breakdown.ts` — contagem de assinaturas por `SubscriptionStatus`, escopada por clínica (`getCurrentClinic()`).
- `features/dashboard/services/get-upcoming-renewals.ts` — até 5 assinaturas ativas com vencimento nos próximos 7 dias.
- `features/dashboard/services/get-revenue-trend.ts` — receita paga de clientes agregada por mês, últimos 6 meses.
- `features/dashboard/services/get-recent-activity.ts` — reaproveita `getAuditLogs()` (já existente em `features/audit-log`) e retorna as 5 entradas mais recentes com rótulos já traduzidos (`AUDIT_ACTION_LABELS`/`AUDIT_ENTITY_LABELS`).

## Arquivos modificados

- `features/dashboard/services/get-dashboard-metrics.ts` — passou a agregar os 4 novos services (em paralelo, via `Promise.all`) para o escopo de clínica; retorna também `currentUserName` (clínica e plataforma) e `canViewRecentActivity` (gate de RBAC explícito para o bloco de atividades).
- `features/dashboard/components/dashboard-home-page.tsx` — cabeçalho ganhou saudação por horário do dia ("Bom dia/Boa tarde/Boa noite, {primeiro nome}"), kicker de período (data atual por extenso) e ação contextual (`Nova assinatura` para clínica com permissão de gerenciar assinaturas; `Ver contas em atraso` para plataforma com permissão de gerenciar cobrança). Adicionados os 4 novos blocos ao escopo de clínica: gráfico de barras de evolução de receita (6 meses), lista de assinaturas por status (reutilizando `SubscriptionStatusBadge`), lista de vencimentos próximos e feed de atividades recentes.
- `messages/pt-BR.json` — novas chaves: `dashboard.greeting.*`, `dashboard.primaryAction.*`, `dashboard.revenueTrend.*`, `dashboard.subscriptionsByStatus.*`, `dashboard.upcomingRenewals.*`, `dashboard.recentActivity.*`.

## Decisões arquiteturais

- **Novos services de leitura, não novas regras de negócio**: os 4 arquivos novos em `features/dashboard/services/` seguem exatamente o padrão já usado pelos services irmãos existentes (`get-active-patients.ts`, `get-active-subscriptions.ts` etc.) — consultas Prisma somente leitura, escopadas por `getCurrentClinic()`, sem nenhuma nova regra de negócio ou Server Action. `getRecentActivity` não duplica a lógica de auditoria: reaproveita `getAuditLogs()` integralmente.
- **`canViewRecentActivity` explícito no retorno do service** em vez de o componente inferir a permissão a partir de um array vazio — evita confundir "sem permissão" com "sem atividade", que são estados visuais diferentes.
- **Blocos novos aplicados apenas ao escopo de clínica**: o título da task ("Dashboard Executivo da Clínica") e o maior gap identificado na auditoria apontavam para o lado clínica. O lado plataforma já tinha um "o que precisa de atenção hoje" rico e específico; estender os 4 blocos novos também para lá dobraria o escopo desta task. Ação contextual e saudação foram aplicadas aos dois escopos por serem transversais e baratas.
- **Gráfico de evolução de receita construído com barras CSS simples** (sem nova dependência de biblioteca de gráficos) — consistente com "sem biblioteca paralela ao shadcn/ui" fixado na UI-001.
- **Débito técnico identificado, não corrigido aqui**: `SubscriptionStatusBadge` (reutilizado no bloco "assinaturas por status") usa cores Tailwind hardcoded (`emerald/amber/slate/orange/rose/zinc`) em vez dos tokens da UI-001. Não foi meu escopo corrigi-lo — pertence a `features/subscriptions/components`, dentro do escopo da UI-011. Documentado como recomendação para aquela task.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros (1 erro de tipagem encontrado e corrigido durante o desenvolvimento: campo `Patient.fullName`, não `name`).
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 27 rotas geradas.
- **Verificação em navegador (Playwright)**, autenticando como usuário de clínica (`owner+nortex-medical@membership-core.local`) e de plataforma (`owner+workspace@membership-core.local`) contra o banco local semeado (`pnpm db:seed`):
  - Escopo clínica: saudação "Bom dia, Owner", kicker "02 de agosto de 2026", botão "Nova assinatura", os 6 KPIs, gráfico de evolução de receita mostrando R$ 99,90 em julho (dado real do seed), assinaturas por status (1 Ativa, 0 nas demais), vencimentos próximos com estado vazio correto, e atividades recentes mostrando o evento de login real do usuário — tudo renderizado, 0 erros de console.
  - Escopo plataforma: saudação, kicker de período, ação "Ver contas em atraso", cartões de atenção e panorama com dados reais (4 contas ativas, 1 em teste) — 0 erros de console.
  - Screenshots de página inteira confirmam o resultado visual em ambos os escopos.

## Trabalho remanescente

- Cores hardcoded em `SubscriptionStatusBadge` — recomendado corrigir na UI-011.
- Blocos de evolução de receita/vencimentos/atividades não foram estendidos ao escopo de plataforma (decisão de escopo desta task, ver acima).

## Riscos

- Baixo: todas as novas consultas são somente leitura e escopadas por clínica através dos helpers de tenant já existentes (`getCurrentClinic()`). Nenhuma Server Action, schema ou regra de negócio foi alterada.

## Próxima task sugerida

`UI-005-patients-list.md`.
