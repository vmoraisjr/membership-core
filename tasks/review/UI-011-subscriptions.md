# UI-011 - Assinaturas: Listagem, Criação e Lifecycle — Relatório de Implementação

## Objetivo da task

Tornar assinaturas simples e transparentes: listagem (paciente, plano, valor, início, vencimento, status, próximo pagamento, ações); formulário (paciente, plano, datas, resumo financeiro, benefícios, confirmação); lifecycle (pausar, retomar, renovar, cancelar, expirar, sempre explicando consequência e preservando histórico); status compreensível; ações destrutivas sem ambiguidade; fluxo rápido.

## Auditoria prévia

Esta era a feature mais madura do conjunto: 100% em i18n, todas as transições de lifecycle (pausar/retomar/renovar/cancelar/expirar) já implementadas com `ConfirmDialog` e descrições que já explicavam a consequência de cada ação corretamente — nenhuma mudança foi necessária nesse ponto. Os gaps reais contra o pedido da task: a listagem não mostrava **valor**, **início** nem **próximo pagamento** (só paciente/plano/status/vencimento); o formulário não mostrava **resumo financeiro** nem **benefícios**; `<select>`/`<input>` ainda eram HTML crus; e `SubscriptionStatusBadge` usava cores Tailwind hardcoded (`emerald/amber/slate/orange/rose/zinc`), já sinalizado como pendência no relatório da UI-008.

## Arquivos modificados

- `features/subscriptions/services/get-subscriptions.ts` — passou a incluir a cobrança pendente/em atraso mais próxima (`patientInvoices`, `where: status in [PENDING, OVERDUE]`, `take: 1`, ordenada por vencimento) para derivar "próximo pagamento" com dado real, sem inventar uma nova entidade de cobrança recorrente (o app não tem motor de cobrança automática — isso é reconhecido em `docs/known-limitations.md` e não foi alterado).
- `features/subscriptions/services/get-subscription-form-options.ts` — passou a incluir `monthlyPrice` (já existia) e a contagem de benefícios ativos por plano (`_count`), para alimentar o resumo financeiro do formulário sem duplicar lógica de negócio.
- `features/subscriptions/components/subscription-status-badge.tsx` — reescrito para usar `StatusIndicator` (tokens de design) em vez de cores hardcoded, mantendo a mesma API pública (`status` prop) — nenhum outro arquivo precisou mudar.
- `features/subscriptions/components/subscriptions-table.tsx` — filtros migrados para `Select`/`Input`; colunas adicionadas (Valor, Data de início, Próximo pagamento); estado vazio migrado do `<div>` manual para `EmptyState`, com mensagens diferenciadas (sem assinaturas vs. sem resultado do filtro) — fecha a inconsistência já registrada na UI-000 (era a única tabela do app sem `EmptyState`).
- `features/subscriptions/components/subscription-dialog.tsx` — reorganizado em `FormSection`s (Identificação, Datas, Resumo financeiro — condicional ao plano selecionado); `<select>`s migrados para `Select`; resumo financeiro dinâmico (preço mensal, benefícios ativos) via `useWatch`.
- `messages/pt-BR.json` — novas chaves: `subscriptions.table.{nextPayment,emptyTitle,emptyDescription,noResultsTitle,noResultsDescription}`, `subscriptions.summary.{title,monthlyPrice,activeBenefits}`.

## Decisões arquiteturais

- **"Próximo pagamento" derivado de `PatientInvoice`, não de um novo conceito**: como o app não tem cobrança recorrente automática (billing manual em V1, confirmado em `docs/known-limitations.md`), "próximo pagamento" é a cobrança pendente/em atraso mais próxima já existente para aquela assinatura — dado real, sem nenhuma nova regra de negócio ou tabela.
- **`plans` com campos opcionais em `SubscriptionDialog`**: `monthlyPrice`/`activeBenefitsCount` foram adicionados como opcionais (não obrigatórios) no tipo de `plans`, porque o diálogo é reaproveitado a partir de `features/patients` com uma lista de planos mais simples (`{id, name}`); tornar os campos opcionais evita quebrar essa integração — o resumo financeiro simplesmente não aparece quando os dados não estão disponíveis, em vez de forçar uma alteração em cascata em outra feature.
- **`SubscriptionStatusBadge` corrigido sem quebrar consumidores**: a mudança para tokens preservou a assinatura pública do componente (`status: SubscriptionStatus`), então nenhum dos outros lugares que já usam este badge precisou de alteração.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 28 rotas geradas.
- `pnpm test:membership` — ✅ os 4 cenários passaram, incluindo o de ciclo de vida de assinatura (histórico de cobrança preservado, renovação bloqueada após cancelamento).
- `pnpm test:tenant` — ✅ os 11 cenários de isolamento entre tenants passaram, incluindo o de métricas de dashboard — confirma que a nova consulta de "próximo pagamento" respeita o isolamento por clínica.
- **Verificação em navegador (Playwright)**: autenticado como `owner+nortex-medical@membership-core.local`. Listagem mostra todas as colunas pedidas com dados reais, incluindo "Próximo pagamento" (31/07/2026, refletindo uma cobrança em atraso real do seed) e status via badge com tokens corretos. Diálogo de criação mostra as 3 seções, com o "Resumo financeiro" aparecendo dinamicamente ao selecionar um plano (R$ 99,90 · 1 benefício ativo). 0 erros de console.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Baixo: as duas novas consultas (`patientInvoices` em `getSubscriptions`, `_count` em `getSubscriptionFormOptions`) são somente leitura sobre relações já existentes. Suítes de regressão de membership e isolamento de tenant confirmam que nada foi afetado.

## Próxima task sugerida

`UI-012-payments.md`.
