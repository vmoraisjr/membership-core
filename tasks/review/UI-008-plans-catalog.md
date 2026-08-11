# UI-008 - Planos: Catálogo, Formulário e Detalhes — Relatório de Implementação

## Objetivo da task

Transformar planos em área comercial: listagem (nome, preço, periodicidade, benefícios, assinantes ativos, status, ações); formulário (informações, preço, vigência, benefícios, status, resumo antes de salvar); detalhes (visão do plano, benefícios, assinantes, receita estimada, status, histórico básico); comparação fácil, status óbvio, consequências de desativação explicadas.

## Auditoria prévia

A listagem já cobria a maior parte do pedido (nome, preço mensal, benefícios, assinaturas ativas, status, ações com `Table`/`EmptyState`/`DataTableContainer`). Achados relevantes:

- O schema Prisma já tinha `annualPrice Float?`, mas **nunca foi exposto** em nenhuma camada da aplicação: ausente do Zod schema, do formulário, das actions de criar/atualizar e da listagem — dado morto desde a definição do banco.
- `get-membership-plan-by-id.ts` **existia como arquivo vazio** (0 bytes) — claramente uma tela de detalhes estava planejada e nunca implementada; não havia rota `/dashboard/plans/[planId]` nenhuma.
- `cloneMembershipPlan` (Server Action completa, com auditoria e clonagem de benefícios) **existia mas nunca foi chamada por nenhum componente**.
- `membership-plan-row-actions.tsx` tinha strings 100% hardcoded em **inglês** ("Read only", "Plan deactivated...", "Deactivate membership plan?"...) apesar de todas as chaves `plans.rowActions.*` já existirem prontas em `messages/pt-BR.json` — um caso de tradução pronta e nunca conectada.

## Arquivos criados

- `features/membership-plans/services/get-membership-plan-by-id.ts` — implementado (estava vazio): busca o plano por id escopado por clínica, assinaturas ativas com paciente, receita mensal estimada (assinantes ativos × preço mensal, dado real) e um histórico básico via `AuditLog` filtrado por `entityId`.
- `features/membership-plans/components/membership-plan-details-page.tsx` — nova tela de detalhes: visão geral, benefícios (com `StatusIndicator`, primeiro uso real do componente criado na UI-001), assinantes, receita mensal estimada (`MetricCard`) e histórico básico.
- `app/(dashboard)/dashboard/plans/[planId]/page.tsx` — nova rota.

## Arquivos modificados

- `features/membership-plans/schemas/membership-plan.schema.ts` — adicionado `annualPrice` (opcional, com `preprocess` para tratar campo vazio corretamente como "não informado" em vez de `0`).
- `features/membership-plans/actions/{create,update}-membership-plan.ts` — passaram a persistir `annualPrice`.
- `features/membership-plans/actions/clone-membership-plan.ts` — sufixo do nome clonado trocado de `"Copy"` (inglês, nunca visto em produção pois a ação nunca era chamada) para `"(cópia)"`, já que esta task conecta a ação à UI pela primeira vez.
- `features/membership-plans/components/membership-plan-dialog.tsx` — reorganizado em `FormSection`s (Informações, Preço, Resumo antes de salvar); campo de preço anual adicionado; resumo dinâmico (nome, preço mensal formatado, status atual em modo edição) via `useWatch`.
- `features/membership-plans/components/membership-plan-row-actions.tsx` — strings hardcoded substituídas pelas chaves de i18n já existentes; adicionados botão "Visualizar" (link para detalhes, inclusive em modo somente leitura) e botão "Duplicar plano" (conecta `cloneMembershipPlan`, até então órfã).
- `features/membership-plans/components/membership-plans-table.tsx` — filtros migrados para `Select`/`Input`; nome do plano agora é link para a página de detalhes; coluna "Preço anual" adicionada; mensagens de vazio diferenciadas (sem planos vs. sem resultado do filtro).
- `messages/pt-BR.json` — novas chaves: `plans.dialog.{annualPrice,annualPriceHint,summaryTitle,summaryStatus}`, `plans.table.{annualPrice,noResultsTitle,noResultsDescription}`, `plans.rowActions.{clone,cloneSuccess,cloneError}`, `plans.details.*` (10 chaves para a nova tela).

## Decisões arquiteturais

- **"Vigência" interpretada como status ativo/inativo**, não como intervalo de datas: o schema não tem campos de início/fim de vigência para planos, e criar esse conceito exigiria migração de banco — fora do escopo desta task ("não altere o schema Prisma sem migration"). O status (ativo/inativo), já gerenciado pelas ações dedicadas de desativar/reativar com confirmação e explicação de consequências, cobre o requisito de forma real.
- **"Benefícios" no formulário tratado como resumo, não como editor de linhas**: os benefícios já são uma feature própria (`membership-benefits`) vinculada por `planId`; duplicar esse CRUD dentro do diálogo do plano criaria dois lugares para a mesma operação. O link "Abrir suporte de benefícios" já existente na listagem continua sendo o caminho de edição de benefícios.
- **Receita estimada é um cálculo real**, não uma métrica fictícia: `assinantes ativos × preço mensal`, calculado a partir de dados já consultados no mesmo request — sem nova lógica de negócio, apenas apresentação de um produto de dados já existentes.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 28 rotas geradas (nova rota `/dashboard/plans/[planId]` confirmada).
- `pnpm test:membership` — ✅ os 4 cenários passaram, incluindo o de desativação/reativação de plano — confirma que adicionar `annualPrice` ao schema/actions não quebrou a lógica de negócio existente.
- **Verificação em navegador (Playwright)**: autenticado como `owner+nortex-medical@membership-core.local`. Listagem mostra "Preço anual R$ 999,00" (dado real do seed, antes invisível), nome do plano como link. Diálogo de criação mostra as 3 seções e o resumo dinâmico atualizando em tempo real. Navegação até a página de detalhes de "Premium Health" confirma: visão geral com 4 campos, card de receita mensal estimada (R$ 99,90 = 1 assinante ativo × preço mensal), tabela de benefícios com `StatusIndicator`, tabela de assinantes com link para o perfil do paciente, e histórico básico com estado vazio correto. 0 erros de console em toda a verificação.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Baixo: `annualPrice` é um campo já existente no schema Prisma (sem migration necessária); a persistência foi adicionada de forma aditiva (`?? null`) sem alterar o comportamento de planos que não o utilizam. Suíte de regressão de membership confirma que nada quebrou.

## Próxima task sugerida

`UI-009-benefits-catalog.md`.
