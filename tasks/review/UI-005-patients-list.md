# UI-005 - Gestão de Pacientes: Listagem — Relatório de Implementação

## Objetivo da task

Listagem operacional rápida: header com total e "Novo paciente"; filtros por nome/documento, status, plano e período; tabela com nome clicável, contato, plano atual, status, última atividade e ações (visualizar, editar, usar benefício, suspender/reativar, exclusão permanente quando permitida); estados loading/vazio/sem resultado/erro; alternativa responsiva para tabela.

## Auditoria prévia

`patients` já era a feature mais madura do app (classificada "Manter" na UI-000): `Table`/`EmptyState`/`DataTableContainer`, `Dialog`, `ConfirmDialog`, i18n consistente. Gaps reais contra o pedido desta task: faltavam os filtros de **plano** e **período** (só existiam status + busca); faltava a coluna **última atividade**; contato (telefone) não aparecia como campo próprio; filtro de status e busca usavam `<select>`/`<input>` HTML crus em vez do design system; não existia ação "visualizar" explícita (só o nome clicável); não existia nenhuma alternativa responsiva para a tabela (audit §4); e a mensagem de "vazio" era idêntica para "sem nenhum paciente" e "sem resultado para o filtro atual".

## Arquivos modificados

- `features/patients/components/patients-table.tsx` — reescrita: toolbar migrada para `Select`/`Input` do design system; adicionados filtros de plano (`shared.filters.planFilter`, usando os planos já carregados pela página) e período (`shared.filters.periodFilter`, com opções Últimos 30/90 dias e Este ano, aplicadas sobre `patient.createdAt`); colunas reorganizadas para incluir **Contato** (e-mail + telefone) e **Última atividade** (data de início da assinatura mais recente, com fallback para a data de cadastro — dado real, sem nenhuma nova consulta ao banco: já vinha incluído no retorno de `getPatients()`); mensagens de vazio diferenciadas ("nenhum cliente cadastrado" vs. "nenhum resultado para os filtros atuais"); adicionada alternativa em cartões para telas abaixo de `md`, com os mesmos dados e ações da tabela.
- `features/patients/components/patient-row-actions.tsx` — adicionado botão "Visualizar" (ícone olho, link para o perfil), visível inclusive para perfis somente leitura (que antes não tinham nenhuma ação disponível na linha).
- `features/patients/components/patients-page.tsx` — adicionado indicador de total de clientes no cabeçalho (`meta`).
- `messages/pt-BR.json` — novas chaves: `shared.filters.{periodFilter,allPeriods,last30Days,last90Days,thisYear}`, `shared.actions.view`, `shared.labels.{contact,lastActivity}`, `patients.table.{noResultsTitle,noResultsDescription,totalLabel}`; `patients.table.emptyTitle/emptyDescription` reescritos para descrever especificamente a ausência total de cadastros.

## Decisões arquiteturais

- **"Última atividade" sem nova consulta**: `getPatients()` já retornava `subscriptions` (ordenadas por `startedAt desc`) e `createdAt` no objeto completo do paciente; apenas o tipo local usado pela tabela não os expunha. Nenhuma lógica de negócio nova foi criada.
- **Filtro de período com faixas pré-definidas** (30/90 dias, este ano) em vez de dois campos de data livres — mantém o toolbar simples e consistente com os demais filtros de select.
- **Consolidação das ações de linha em `DropdownMenu` foi avaliada e descartada nesta task**: os componentes de diálogo já existentes (`ConfirmDialog`, `PatientDialog`, `SubscriptionDialog`, `ConsumeBenefitDialog`) gerenciam seu próprio estado de abertura via `trigger` com `asChild`; aninhar esses triggers dentro de um `DropdownMenuItem` tem um risco real de condição de corrida conhecido do Radix (o menu fecha e desmonta o trigger antes do diálogo abrir). Corrigir isso exigiria alterar a API de vários componentes compartilhados usados por outras features — fora do escopo desta task. A responsividade da tabela foi resolvida pela via segura — alternativa em cartões (critério de aceite explícito) — a consolidação de ações em `DropdownMenu` fica para a UI-019 (Responsividade e Acessibilidade), que já era o destino recomendado desde a auditoria UI-000.
- **Loading/erro**: mantidos os mecanismos globais já existentes (skeleton de segmento do dashboard e o error boundary de `app/(dashboard)/error.tsx`) — estados de loading/erro por página são o escopo dedicado da UI-018 (Estados Globais e Feedback), não desta task.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings (2 warnings de variável não utilizada encontrados e corrigidos durante o desenvolvimento).
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 27 rotas geradas.
- **Verificação em navegador (Playwright)**, autenticado como `owner+nortex-medical@membership-core.local`, em 1440px e 375px:
  - Desktop: tabela completa com os 4 filtros, todas as colunas pedidas, botões visualizar/editar visíveis, badge de total no cabeçalho — 0 erros de console.
  - Mobile (375px): tabela oculta, cartões renderizando os mesmos dados e ações, filtros empilhados verticalmente — 0 erros de console.
  - Observação registrada, não corrigida aqui: com muitas ações simultaneamente visíveis (paciente titular ativo com todas as permissões), a célula de ações ainda depende de rolagem horizontal em telas largas — comportamento preexistente, documentado como pendência da UI-019.

## Trabalho remanescente

- Consolidação de ações de linha em `DropdownMenu` — UI-019.
- Estados de loading/erro dedicados por página — UI-018.

## Riscos

- Baixo: mudanças de apresentação e dois novos filtros client-side sobre dados já carregados; nenhuma Server Action, schema ou RBAC alterado.

## Próxima task sugerida

`UI-006-patient-profile-history.md`.
