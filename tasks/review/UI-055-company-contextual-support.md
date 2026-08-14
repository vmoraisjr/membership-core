# UI-055 — Chamados: Fila Global com Contexto de Empresa — Relatório de Implementação

## Objetivo

Preservar Chamados como fila global de atendimento da plataforma, mas
eliminar a troca de contexto: todo chamado leva à empresa relacionada e
toda empresa expõe sua própria conversa, sem duplicar interface ou
queries.

## Arquivos criados

- `features/messages/utils/support-navigation.ts` — 3 helpers puros
  compartilhados por fila global e aba contextual: `withThreadId(base,
  threadId)` (concatena preservando `?`/`&`), `resolveSupportReturnTo`
  (lê `returnTo` do FormData, só aceita caminhos iniciando com
  `/dashboard/`, senão cai no fallback do caller), e
  `revalidateSupportPaths(clinicId?)` (revalida `/dashboard/messages`,
  `/dashboard/chamados` e, se houver, `/dashboard/empresas/{clinicId}`).
- `features/clinic/components/company-chamados-tab.tsx` — wrapper fino:
  monta o `scope` (`clinicId`, `clinicName`, `returnBase` via
  `empresaUrl(clinicId, { tab: "chamados" })`) e delega toda a
  renderização/dado para `SupportThreadsPage` — nenhuma query nova,
  nenhuma cópia de interface.

## Arquivos modificados

- `features/messages/components/support-threads-page.tsx` — ponto
  central da task. Adicionado `scope?: { type: "global" } | { type:
  "company"; clinicId; clinicName; returnBase }` (default `"global"`):
  - Modo empresa força `clinicId` da consulta para `scope.clinicId`
    (ignora qualquer valor vindo de filtros/URL) — isolamento não
    depende de o componente confiar em input do cliente.
  - Modo empresa esconde o seletor "Empresa" (lista e diálogo "Novo
    chamado") e usa `<input type="hidden" name="clinicId">` em vez
    disso — criar chamado no workspace não pede a própria empresa de
    novo.
  - Modo empresa não repete `DashboardPage`/`PageHeader` (já vem da
    página da empresa) — retorna só o grid de duas colunas, mesmo
    padrão de `company-billing-tab.tsx`/`company-people-panel.tsx`.
  - **Bug real corrigido**: o link de cada chamado na lista apontava
    para `/dashboard/messages?threadId=X`, descartando os filtros de
    categoria/status/empresa ativos ao clicar. Agora usa
    `withThreadId(returnToBase, thread.id)`, onde `returnToBase`
    preserva os filtros atuais (fila global) ou aponta para a aba da
    empresa (contexto).
  - Fila global ganhou um link **"Abrir empresa →"** no cabeçalho do
    chamado selecionado, para `empresaUrl(clinicId, { tab: "chamados",
    threadId })` — âncora explícita pedida no escopo.
  - Aba da empresa ganhou o inverso, **"Ver na fila global →"**, para
    `chamadosUrl({ threadId, clinicId })` — permite sair do contexto
    sem perder o chamado selecionado.
  - As 3 forms de mutação (criar chamado, atualizar status, responder)
    passaram a incluir `<input type="hidden" name="returnTo">` com o
    `returnToBase` calculado, para que a Server Action redirecione de
    volta ao mesmo contexto (fila global filtrada ou aba da empresa) em
    vez de sempre cair em `/dashboard/messages`.
- `features/messages/actions/create-support-thread.ts`,
  `update-support-thread-status.ts`, `add-support-message.ts` — os 3
  redirects hardcoded para `/dashboard/messages?threadId=` substituídos
  por `withThreadId(resolveSupportReturnTo(formData, fallback),
  thread.id)`, com fallback = `/dashboard/chamados` (plataforma) ou
  `/dashboard/messages` (clínica); `revalidatePath` isolado trocado por
  `revalidateSupportPaths(clinicId)`, agora revalidando também a rota
  de empresa afetada.
- `lib/owner-routes.ts` — `empresaUrl` ganhou `threadId`, `category`,
  `status` opcionais, para a aba Chamados da empresa.
- `components/layout/dashboard-sidebar.tsx` — item "Chamados" ganhou
  `platformHref: "/dashboard/chamados"` (mantendo `href:
  "/dashboard/messages"` para o self-service de clínica); lógica de
  link ativo e renderização passaram a resolver `platformHref` quando
  `isPlatformView`. Antes o Owner sempre navegava por
  `/dashboard/messages` e dependia do redirect condicional da UI-049
  para cair em `/dashboard/chamados` — agora o próprio link já é
  canônico.
- `features/clinic/components/platform-clinic-details-page.tsx` — nova
  aba "Chamados" (entre Módulos e Auditoria), renderiza
  `<CompanyChamadosTab>`; `chamadosFilters` (`threadId`/`category`/
  `status`) adicionado às props.
- `app/(dashboard)/dashboard/empresas/[empresaId]/page.tsx` — lê
  `threadId`/`category`/`status` de `searchParams` e repassa como
  `chamadosFilters`.

## Fora do escopo (não alterado)

- Regras de visibilidade/isolação de threads em
  `get-support-threads-overview.ts` — já corretas (clínica sempre
  restrita ao próprio `workspace.clinicId`; plataforma sem restrição
  adicional, igual ao comportamento anterior).
- Qualquer funcionalidade de CRM/inbox omnichannel/WhatsApp/agenda.
- Remoção da rota legada `/dashboard/messages` — continua servindo o
  self-service de clínica e o redirect condicional de plataforma
  (UI-049); remoção de entradas legadas é UI-057.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:tenant` — ✅ 11 cenários, sem regressão.
- `pnpm test:rbac` — ✅ 5 cenários, sem regressão.
- `pnpm test:messages` — ✅ 2 cenários (isolamento cross-tenant de
  threads + auditoria), sem regressão.
- Playwright contra build de produção, login real como Owner Operator:
  - Link "Chamados" da sidebar já navega para `/dashboard/chamados`
    (canônico, sem bounce pelo redirect legado).
  - Aba "Chamados" de uma empresa mostra fila vazia pré-filtrada, sem
    seletor de empresa.
  - Diálogo "Novo chamado" dentro da empresa **não tem** campo de
    empresa (`select[name="clinicId"]` ausente — confirmado por
    contagem 0), só assunto/categoria/mensagem.
  - Criar chamado a partir do workspace: chamado aparece imediatamente
    na lista da própria aba (associado automaticamente ao `clinicId`
    da empresa).
  - "Ver na fila global →" a partir da empresa leva para
    `/dashboard/chamados?threadId=X&clinicId=Y`, com o mesmo chamado
    selecionado e o filtro de empresa já aplicado no dropdown.
  - "Abrir empresa →" a partir da fila global leva de volta para
    `/dashboard/empresas/Y?tab=chamados&threadId=X`, mesmo chamado
    ainda selecionado.
  - Responder ao chamado de dentro da aba da empresa mantém o usuário
    na mesma aba (`?tab=chamados&threadId=X`) depois do submit — não
    cai mais em `/dashboard/messages`.

## Critérios de aceite

- ✅ Owner encontra a empresa a partir de um chamado e o chamado a
  partir da empresa em um clique contextual — os dois links "Abrir
  empresa →"/"Ver na fila global →" confirmados ao vivo.
- ✅ Contexto da empresa não permite acesso a tickets de outra empresa —
  `clinicId` da consulta é sempre o do `scope`, nunca o de um filtro
  vindo do cliente.
- ✅ Fila global permanece eficiente para triagem: filtros de
  categoria/status/empresa inalterados, agora preservados ao clicar em
  um chamado (bug corrigido).

## Riscos

- Baixo: `resolveSupportReturnTo` aceita `returnTo` de FormData, mas
  restringe a caminhos iniciando com `/dashboard/` — não é um redirect
  aberto; qualquer valor fora desse padrão cai no fallback interno
  calculado no servidor.
- Baixo: mudança em `dashboard-sidebar.tsx` é aditiva (`platformHref`
  opcional) — usuários de clínica continuam com `href` original
  inalterado.

## Próxima task

`UI-056-administration-consolidation.md` — seguindo em sequência.
