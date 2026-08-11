# UI-012 - Pagamentos e Cobranças — Relatório de Implementação

## Objetivo da task

Área financeira clara: indicadores (a receber, recebido, vencido, inadimplência); filtros (status, vencimento, forma, plano, paciente); tabela (paciente, plano, valor, vencimento, status, forma, pagamento, ações); ações (confirmar, marcar atraso, alterar forma, cancelar cobrança, ver histórico); valores em padrão brasileiro; status com texto e cor; feedback claro após ações.

## Auditoria prévia

Esta era a feature mais heterogênea do app (UI-000, "achado crítico"): `app/(dashboard)/dashboard/billing/page.tsx` renderizava `BillingPage`, cujo branch de clínica (~530 linhas, sem contar o branch de plataforma também morto) duplicava quase integralmente a lógica e o HTML de `PatientPaymentsPage` — mesma tabela, mesmos helpers de status/label reimplementados em paralelo. Confirmei que `BillingPage` só era importada por essa única rota. A tela realmente alcançável por navegação para usuários de clínica é `/dashboard/payments` (`PatientPaymentsPage`), com apenas 2 indicadores (sem "a receber" nem "inadimplência"), nenhum filtro, e tabela em `<table>` HTML cru.

## Arquivos criados

- `features/billing/components/patient-payments-table.tsx` — nova tabela client-side com os 5 filtros pedidos (status, forma de pagamento, plano, vencimento, busca por cliente/plano), usando `Table`/`EmptyState`/`StatusIndicator`/`Select`/`Input` do design system.

## Arquivos modificados

- `app/(dashboard)/dashboard/billing/page.tsx` — agora redireciona **sempre**: cliente vinculado → `/dashboard/payments`; sem clínica → `/dashboard/billing/catalog`. Antes só o segundo caso redirecionava; o primeiro renderizava `BillingPage` diretamente.
- `features/billing/components/patient-payments-page.tsx` — reescrita: calcula os 4 indicadores pedidos (a receber, recebido no mês, vencido, taxa de inadimplência) a partir dos dados já carregados por `getBillingOverview()` — nenhuma nova consulta ao banco —, exibidos via `MetricCard`/`MetricGrid`; delega a listagem para `PatientPaymentsTable`.
- `features/billing/components/patient-invoice-actions.tsx` — `<select>` de forma de pagamento migrado para `Select` do design system (comportamento idêntico).
- `messages/pt-BR.json` — novas chaves: `billing.sections.{receivable,received,overdueAmount,delinquencyRate}`, `billing.table.{methodFilter,dueDateFilter,searchPatientOrPlan,noResultsTitle,noResultsDescription}`.

## Arquivos removidos

- `features/billing/components/billing-page.tsx` (1164 linhas) — **comprovadamente inalcançável** após a correção do redirect (era importada por um único arquivo, a própria rota que passou a redirecionar antes de renderizá-la). Continha três blocos: um branch de plataforma já morto antes desta task, um branch de clínica que duplicava exatamente o que `PatientPaymentsTable` agora resolve corretamente, e formulários de plano comercial redundantes com `PlatformCommercialCatalogPage`. Removida em vez de mantida como código morto, por ser exatamente o "achado crítico" já sinalizado na auditoria UI-000.

## Decisões arquiteturais

- **Indicadores calculados na camada de apresentação, sem novas consultas**: os 4 valores (a receber, recebido, vencido, inadimplência) são derivados em memória a partir da lista de `patientInvoices` que `getBillingOverview()` já retornava — nenhuma alteração de serviço ou nova query.
- **"Ver histórico" não é um botão separado**: o histórico de pagamentos já aparece inline na própria linha da tabela (coluna "Histórico de pagamento"), consistente com o padrão já usado antes desta task — considerei isso suficiente para o critério, sem adicionar uma ação redundante.
- **`clinic-invoice-actions.tsx`, `clinic-subscription-actions.tsx` e `platform-subscription-section.tsx` não foram tocados**: são órfãos identificados na UI-000, mas não são importados por `billing-page.tsx` (verifiquei antes de remover o arquivo) — pertencem ao escopo de UI-014 (Administração de Clínicas) e UI-016 (Gestão de Módulos), tasks futuras nesta mesma sequência, onde seu destino faz mais sentido contextual.
- **Filtro de plano por nome, não por id**: `getBillingOverview()` seleciona `subscription.membershipPlan.name` mas não o `id`; filtrar por nome é suficiente para a lista de planos de uma única clínica (nomes não colidem no mesmo tenant) e evita alterar o formato de consulta já em uso por outras telas.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 28 rotas geradas.
- `pnpm test:billing` — ✅ os 7 cenários passaram, incluindo troca de forma de pagamento, cancelamento de cobrança pendente e preservação de histórico após cancelamento de assinatura — confirma que a remoção de `billing-page.tsx` e a reescrita da tabela não afetaram nenhuma regra de negócio.
- `pnpm test:tenant` — ✅ os 11 cenários de isolamento entre tenants passaram.
- **Verificação em navegador (Playwright)**: confirmei que `/dashboard/billing` redireciona corretamente para `/dashboard/payments` para um usuário de clínica (antes renderizava a página duplicada). A tela mostra os 4 indicadores com dados reais (R$ 99,90 a receber, R$ 0,00 recebido no mês, R$ 99,90 vencido, 50,0% de inadimplência — refletindo exatamente as 2 cobranças do seed, uma paga e uma em atraso), os 5 filtros, e a tabela com status coloridos e ações corretamente condicionadas (cobrança paga mostra "Status bloqueado"; cobrança em atraso mostra os botões de ação). 0 erros de console.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Médio-baixo: esta task removeu um arquivo de produção inteiro (`billing-page.tsx`). O risco foi mitigado por (1) confirmar via busca textual que era o único importador antes de remover, (2) o build de produção não apresentar nenhum erro de módulo não encontrado, e (3) a suíte de regressão de billing (que cobre exatamente os fluxos de cobrança de paciente e assinatura SaaS) passar integralmente.

## Próxima task sugerida

`UI-013-users-permissions.md`.
