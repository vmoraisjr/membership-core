# UI-056 — Administração: Equipe Sheep e Auditoria Global — Relatório de Implementação

## Objetivo

Reunir as funções internas, pouco frequentes e transversais da
plataforma (usuários internos Sheep, auditoria global) em uma única
área secundária, sem confundi-las com a operação das empresas.

## Contexto: o que já existia

`/dashboard/administracao` já havia sido criada na UI-049, e — ao
contrário de Chamados/Pessoas/Billing, que UI-049 deixou como aliases
finos até suas respectivas tasks — já renderizava diretamente os
componentes completos `UsersPage`/`AuditLogPage` (os mesmos usados nas
rotas legadas `/dashboard/users`/`/dashboard/audit-logs`), com abas
"Equipe Sheep"/"Auditoria global" via `RouteTabs`, e os dois redirects
legados já preservavam todos os query params ao redirecionar
(`administracaoUrl({ tab: ..., ...params })`). Ou seja, a auditoria
antes desta task já apontava que boa parte do trabalho estrutural desta
task tinha sido antecipado. O foco real desta task passou a ser
**auditar a integração** dessas telas dentro do novo contexto e corrigir
o que a mudança de rota deixou incompleto — e havia dois bugs reais.

## Bugs reais encontrados e corrigidos

1. **Cache não revalidava a rota nova.** As 4 Server Actions exclusivas
   de "Equipe Sheep" (`createPlatformUserAction`,
   `updatePlatformUserStatusAction`, `updatePlatformUserDetailsAction`,
   `resetPlatformUserPasswordAction`) só chamavam
   `safeRevalidatePath("/dashboard/users")` — nunca
   `/dashboard/administracao`. Mesmo mutation bem-sucedida no servidor
   (toast de sucesso confirmado), a tabela em
   `/dashboard/administracao?tab=team` continuava mostrando o dado
   antigo até um reload manual. Mesmo padrão de bug já corrigido para
   billing na UI-053 e para chamados na UI-055. Corrigido adicionando
   `safeRevalidatePath("/dashboard/administracao")` nas 4 actions.
2. **Filtro de auditoria descartava `tab=audit`.** O formulário de
   filtros de `AuditLogTable` é um `<form method="get">` sem `action`
   explícita — submete para a URL atual, mas **sem** um campo oculto
   para `tab`, o GET substitui a query string inteira só pelos campos do
   formulário. Resultado: aplicar qualquer filtro em
   `/dashboard/administracao?tab=audit` derrubava `tab` da URL, o que
   fazia `AdministracaoRoute` cair no default (`"team"`) e trocar
   silenciosamente para a aba Equipe Sheep — a auditoria filtrada nunca
   chegava a renderizar. Mesma classe de bug do link de chamado que
   perdia filtros na UI-055. Corrigido com `basePath`/`extraParams`
   (ver abaixo).

## Arquivos modificados

- `features/users/actions/create-platform-user.ts`,
  `update-platform-user-status.ts`, `update-platform-user-details.ts`,
  `reset-platform-user-password.ts` — cada um ganhou uma segunda
  chamada `safeRevalidatePath("/dashboard/administracao")` logo após a
  já existente para `/dashboard/users`.
- `features/audit-log/components/audit-log-page.tsx` — `AuditLogPage`
  ganhou `basePath?: string` (default `"/dashboard/audit-logs"`) e
  `extraParams?: Record<string, string>` (default `{}`), repassados
  para `AuditLogTable`.
- `features/audit-log/components/audit-log-table.tsx` — mesmos dois
  props novos:
  - `<form method="get">` de filtros ganha um `<input type="hidden">`
    por entrada de `extraParams` (ex.: `tab=audit`), preservando o
    contexto ao submeter.
  - `buildPageHref` (paginação anterior/próxima) passou a receber
    `basePath`/`extraParams` e monta a URL a partir deles em vez do
    `/dashboard/audit-logs` fixo.
  - Link "Limpar" passou a apontar para `basePath` + `extraParams` em
    vez de `/dashboard/audit-logs` fixo.
  - Link "Extrair CSV" **não** mudou — aponta sempre para
    `/dashboard/audit-logs/export`, que é um endpoint de download (rota
    `route.ts`, não navegável), correto independente do contexto de
    onde foi acionado.
- `app/(dashboard)/dashboard/administracao/page.tsx` — passa
  `basePath="/dashboard/administracao"` e `extraParams={{ tab: "audit"
  }}` para `<AuditLogPage>`. `/dashboard/audit-logs` (rota legada,
  self-service de clínica) não muda: usa os defaults do componente.

## Fora do escopo (não alterado)

- RBAC, retenção de logs, payload de exportação, política de senha —
  nenhuma regra alterada, só a revalidação de cache e a preservação de
  query params.
- Fusão da auditoria global com o histórico de uma empresa específica —
  a aba Auditoria do workspace (UI-054/055 area) continua sua própria
  consulta filtrada por `clinicId`, independente desta.
- **Deferido para UI-057** (explicitamente, mesmo padrão de itens já
  adiados em tasks anteriores): os hrefs internos de paginação/exportar
  em `/dashboard/audit-logs` legado continuam hardcoded para si mesmo
  quando usados fora do contexto de administração — isso já funciona
  hoje via bounce pelo redirect condicional (UI-049), só não é
  canônico; a varredura completa de hrefs internos é o escopo da
  UI-057.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído (2
  rodadas, uma por bug corrigido).
- `pnpm test:users` — ✅ 4 cenários, sem regressão (proteção do último
  owner, ciclo de convite, ativação/desativação).
- `pnpm test:audit` — ✅ 8 cenários, sem regressão.
- `pnpm test:rbac` — ✅ 5 cenários, sem regressão.
- Playwright contra build de produção, login real como Owner Operator:
  - Sidebar "Equipe Sheep"/"Auditoria global" (seção Administração,
    recolhida por padrão) leva a `/dashboard/administracao?tab=team`/
    `?tab=audit`.
  - Criar usuário na aba Equipe Sheep: usuário aparece na tabela após
    reload simples (bug 1 confirmado corrigido).
  - Alternar status (Desativar) do usuário recém-criado: badge muda
    para "Inativo" **sem reload** (`status after toggle (no reload):
    Inativo`) e permanece após reload — confirma que a mutação e a
    revalidação da rota nova funcionam juntas.
  - Aplicar filtro de entidade na aba Auditoria: URL final
    `?tab=audit&entity=APP_USER&...` — aba "Auditoria global" continua
    ativa e a tabela mostra os resultados filtrados (bug 2 confirmado
    corrigido; antes do fix a URL perdia `tab=audit` e a tela voltava
    para Equipe Sheep).
  - `/dashboard/users` (legado) → `/dashboard/administracao?tab=team`.
  - `/dashboard/audit-logs?entity=APP_USER&page=1` (legado) →
    `/dashboard/administracao?tab=audit&entity=APP_USER&page=1` — todos
    os filtros preservados no redirect.

## Critérios de aceite

- ✅ Usuários internos e auditoria global são encontrados sob
  Administração, sem entradas laterais concorrentes (sidebar só expõe
  os dois itens sob "Administração", nada aponta para as rotas legadas
  diretamente).
- ✅ Links antigos chegam à aba correta e preservam filtros de
  auditoria — confirmado via os dois redirects legados.
- ✅ Operações owner-only continuam bloqueadas para admins quando a
  regra existente exigir OWNER — `test:rbac` sem regressão, lógica de
  guarda intocada (só a revalidação foi adicionada).

## Riscos

- Baixo: mudanças são estritamente aditivas — uma segunda chamada de
  `safeRevalidatePath` e dois props opcionais com defaults que
  preservam o comportamento anterior das rotas legadas
  (`/dashboard/users`, `/dashboard/audit-logs` continuam se
  comportando exatamente como antes para usuários de clínica).

## Próxima task

`UI-057-owner-legacy-removal-and-link-regression.md` — seguindo em
sequência.
