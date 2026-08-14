# UI-061 — Hub Clientes e Fluxo de Cadastro — Relatório de Implementação

## Entrega

- A tabela de `/dashboard/clientes` foi simplificada para quatro colunas de
  decisão: **Cliente** (identificação, tipo/dependência, documento
  mascarado e e-mail), **Plano atual**, **Situação financeira** e
  **Ações**. Contato e documento deixaram de ser colunas próprias e foram
  agregados à identificação; "Última atividade" saiu da tabela por não ser
  decisória.
- **Situação financeira** é nova: um badge (Em dia / N pendente(s) / N em
  atraso) calculado a partir das faturas do titular
  (`getPatientFinancialSummaries`, uma única consulta agregada por
  clínica, sem duplicar o domínio de billing) e que já linka para a aba de
  cobrança do cliente.
- Ações de linha foram reduzidas a **um botão contextual** ("Ver cliente")
  mais **um menu "Ações"** (dropdown) contendo editar, adicionar
  dependente, nova assinatura, registrar uso de benefício e
  desativar/reativar/excluir — nunca mais de dois elementos interativos
  diretos por linha, conforme o critério de aceite.
- **Novo cliente** permanece a ação principal do cabeçalho. Ao cadastrar um
  titular (com permissão de assinaturas e ao menos um plano ativo), o
  diálogo não fecha mais sozinho: mostra um passo explícito **"Adicionar
  assinatura agora"** (abre o diálogo de assinatura já preenchido com o
  cliente recém-criado) ou **"Concluir depois"**. Dependentes e clínicas
  sem plano/permissão mantêm o fechamento direto de antes.
- O cliente abre como **workspace próprio** (`/dashboard/clientes/[id]`),
  preservando filtros e retorno: a listagem sincroniza busca, status,
  plano e período na URL (com debounce, sem afetar diálogos abertos) e
  cada link para o cliente carrega `returnTo` com a URL filtrada atual. O
  botão "Voltar para clientes" do workspace usa esse `returnTo` quando
  presente.
- Links de plano/assinatura e de situação financeira agora abrem o cliente
  nas abas `membership`/`billing` (mapeadas para as abas internas atuais
  `subscriptions`/`payments`; a renomeação de abas fica para a UI-062), em
  vez de apontar para `/dashboard/subscriptions?patientId=...`.
- Dependentes continuam tratados como parte do titular: a linha mostra
  "herdado do titular" e o menu de linha reflete que assinatura/cobrança
  não são ações diretas do dependente.

## Correção encontrada durante a validação

A sincronização de filtros com a URL disparava `router.replace` mesmo no
primeiro carregamento (sem qualquer filtro alterado pelo usuário). Isso
causava uma renavegação suave do Next.js que recarregava os componentes de
servidor e **resetava o formulário "Novo cliente" enquanto a pessoa ainda
digitava**, por causa do `useEffect` que reidrata o formulário quando as
props (`responsibleOptions` etc.) mudam. Corrigido para o efeito de
sincronização ignorar a montagem inicial e só disparar em mudanças reais de
filtro.

## Segurança e domínio

- Nenhuma mudança de schema Prisma, RBAC ou Server Action existente; a
  única alteração de contrato foi `createPatient` passar a retornar
  `{ id, fullName, kind }` (necessário para o passo "Adicionar assinatura
  agora"), e `SubscriptionDialog` ganhar suporte a `open`/`onOpenChange`
  controlados (usado para o encadeamento pós-cadastro e opcional para os
  demais chamadores, que continuam com o comportamento não controlado de
  antes).
- `getPatientFinancialSummaries` é uma leitura agregada (`groupBy`)
  isolada por `clinicId`, sem escrita e sem duplicar `getBillingOverview`.
- Isolação por clínica preservada em toda a nova consulta e em todos os
  links construídos.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.
- `pnpm test:membership` — 4 cenários passaram.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:rbac` — 5 cenários passaram.
- `pnpm test:billing` — 14 cenários passaram (checagem extra, por ter
  tocado uma leitura de faturas).
- Playwright (build de produção, roteiro descartável após validação):
  redirecionamento de `/dashboard/patients` para `/dashboard/clientes`;
  tabela com as quatro colunas esperadas; cadastro de titular seguido da
  escolha explícita "Adicionar assinatura agora" (encadeando o diálogo de
  assinatura já preenchido) e "Concluir depois"; menu de linha com ação
  primária + menu "Ações"; link de plano abrindo a aba do cliente; filtro
  aplicado e preservado via `returnTo` ao voltar da ficha do cliente;
  cadastro de dependente herdando o titular; desativação de cliente
  refletida no filtro de status.
- Observação: os specs Playwright já existentes
  `tests-e2e/clinic-operations.spec.mjs` e `tests-e2e/auth-and-platform.spec.mjs`
  estão com seletores desatualizados independentemente desta task (ex.:
  `getByPlaceholder("Telefone")` não bate com o placeholder atual
  `"(00) 00000-0000"`, e textos de dashboard/login também mudaram). Não
  fazem parte do escopo da UI-061 e nenhum arquivo por trás dessas falhas
  foi tocado aqui; ficam registrados para uma manutenção futura de QA.

## Próxima task

UI-062 — Workspace do Cliente: Relacionamento Completo.
