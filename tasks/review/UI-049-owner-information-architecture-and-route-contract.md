# UI-049 — Owner: Arquitetura de Informação, Rotas Canônicas e Transição Segura — Relatório de Implementação

## Objetivo

Estabelecer as 5 rotas canônicas da nova IA do owner (Início já existe) como
adaptadores finos sobre os componentes existentes, com redirecionamento
compatível das rotas antigas, sem reestruturar conteúdo de tela nem alterar
regra de negócio — fundação para UI-050 a UI-058.

## Decisão de design: quais rotas redirecionar sempre vs. condicionalmente

Auditei (via subagent, read-only) as 9 rotas antigas listadas no escopo e
descobri que 4 delas (`modules`, `messages`, `users`, `audit-logs`) são
**compartilhadas**: o mesmo componente-página já ramifica internamente por
`currentUser.clinicId`/`resolveCurrentWorkspace` para servir tanto o owner
quanto o usuário de uma empresa cliente (ex.: `/dashboard/users` renderiza
`PlatformUsersOverviewPanel` para o owner e `UsersOverviewPanel` — gestão da
própria equipe — para a empresa). As outras 5 (`clinics`, `clinics/[id]`,
`billing/catalog`, `billing/subscriptions`, `billing/payments`) já são
platform-only na prática (guarda `AccessDenied` explícita ou nav item
`platformOnly: true` sem uso real por conta de empresa).

Para não quebrar a navegação de usuários vinculados a empresa (critério que
a própria UI-051 exige preservar, e que já é o comportamento correto hoje),
apliquei:

- **Redirecionamento incondicional** nas 5 rotas platform-only.
- **Redirecionamento condicional** (`getCurrentWorkspace().type === "platform"`)
  nas 4 rotas compartilhadas — o owner é redirecionado para a nova área
  ("Planos comerciais", "Administração", "Chamados"); a empresa cliente
  continua exatamente na mesma URL/tela de sempre, sem nenhuma mudança.

## Arquivos criados

- `lib/owner-routes.ts` — builders de URL tipados (`empresasUrl`,
  `empresaUrl`, `planosComerciaisUrl`, `chamadosUrl`, `administracaoUrl`);
  não existia nenhuma convenção de helper de rota no projeto antes disso —
  toda URL era montada como template string solta em cada arquivo.
- `components/dashboard/route-tabs.tsx` — trocador de abas por `Link` (não
  client state), no mesmo padrão já usado em
  `platform-clinic-details-page.tsx`; reaproveitado pelas duas rotas novas
  com abas.
- `app/(dashboard)/dashboard/empresas/page.tsx` — adaptador fino de
  `ClinicPage` (mesmo componente de `/dashboard/clinics`, sem alteração).
- `app/(dashboard)/dashboard/empresas/[empresaId]/page.tsx` — adaptador de
  `PlatformClinicDetailsPage`; traduz `tab=billing` (alvo do redirect de
  assinaturas/pagamentos) para `overview`, já que a aba "Plano e cobrança"
  dedicada é escopo da UI-053 — hoje "Visão geral" já mostra cartões de
  plano atual, próximo vencimento e blocos "Assinatura SaaS"/"Pagamentos"
  com link para gerenciar, então a diferença é apenas o rótulo da aba ativa,
  não a informação disponível.
- `app/(dashboard)/dashboard/planos-comerciais/page.tsx` — nova rota com
  abas **Planos** (`PlatformCommercialCatalogPage`, inalterado) e **Módulos
  incluídos** (`ModulesPage`, inalterado).
- `app/(dashboard)/dashboard/administracao/page.tsx` — nova rota com abas
  **Equipe Sheep** (`UsersPage`) e **Auditoria global** (`AuditLogPage`),
  ambos componentes inalterados.
- `app/(dashboard)/dashboard/chamados/page.tsx` — adaptador fino de
  `SupportThreadsPage` (mesmo componente de `/dashboard/messages`).

## Arquivos modificados

- 9 rotas antigas (`clinics/page.tsx`, `clinics/[clinicId]/page.tsx`,
  `billing/catalog/page.tsx`, `billing/subscriptions/page.tsx`,
  `billing/payments/page.tsx`, `modules/page.tsx`, `messages/page.tsx`,
  `users/page.tsx`, `audit-logs/page.tsx`) — viraram redirects (ou redirects
  condicionais, ver acima), preservando todos os filtros/query params
  relevantes de cada uma na URL de destino.
  - `billing/subscriptions` e `billing/payments`: com `clinicId` na query,
    vão direto para `empresaUrl(clinicId, { tab: "billing" })`; sem
    `clinicId`, vão para `empresasUrl()` **sem** tentar traduzir
    `status`/`planId` — o vocabulário de status de assinatura SaaS
    (`TRIAL`/`PAST_DUE`/...) não tem equivalente no filtro de status da
    lista de empresas hoje (que é `ClinicStatus.ACTIVE/INACTIVE`, um
    conceito diferente); inventar essa tradução seria "reestruturar
    conteúdo de tela", fora do escopo desta task. Registrado como pendência
    abaixo.
- `features/clinic/components/platform-clinic-details-page.tsx` — a função
  interna `tabHref` apontava para `/dashboard/clinics/${clinicId}`; agora
  aponta para `/dashboard/empresas/${clinicId}` (senão clicar numa aba
  dentro da página nova faria a página voltar para a URL antiga e perder o
  contexto). Nenhuma outra linha do arquivo mudou.
- `components/layout/breadcrumb-trail.tsx` — `SEGMENT_LABELS` ganhou
  `empresas`, `planos-comerciais`, `chamados`, `administracao`; as entradas
  antigas (`clinics`, `billing`, `messages`, `users`, `audit-logs`) foram
  mantidas porque `messages`/`users`/`audit-logs` continuam servindo
  diretamente contas de empresa (rota compartilhada), e `clinics`/`billing`
  ficam como fallback inofensivo (nunca mais renderizam, pois a rota
  redireciona antes do breadcrumb montar).

## Fora do escopo (não alterado)

- Sidebar (ainda mostra as 9 entradas antigas) — UI-051.
- Conteúdo/abas reais de "Plano e cobrança", "Pessoas", "Chamados",
  "Histórico" no workspace de empresa — UI-053/054/055.
- Links internos distantes que ainda apontam para `/dashboard/clinics/...`
  (ex.: "Abrir workspace completo" em `clinic-row-actions.tsx`,
  `clinic-quick-view-panel.tsx`, `saas-subscription-details-panel.tsx`, e o
  link "Gerenciar assinatura SaaS"/"Ver pagamentos" dentro do próprio
  `platform-clinic-details-page.tsx`) — continuam funcionando via
  redirecionamento (confirmado no teste), só ganham uma volta extra até
  chegar na URL canônica; atualizá-los é explicitamente escopo da UI-057
  ("Auditar todas as ocorrências de href... Atualizar os links internos
  para as rotas canônicas").
- Tradução de filtro de status/plano nas rotas de assinatura/pagamento sem
  `clinicId` (ver acima).

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído; as 5 rotas
  novas aparecem no manifest de rotas.
- `pnpm test:tenant` — ✅ 11 cenários.
- `pnpm test:rbac` — ✅ 5 cenários.
- `pnpm test:billing` — ✅ 7 cenários.
- `pnpm test:modules` — ✅ 4 cenários.
- Verificação end-to-end real com Playwright (login como Owner Operator e
  como owner da clínica Nortex Medical, contra build de produção):
  - Todos os 8 redirects de rota antiga → canônica confirmados, com query
    params preservados exatamente como esperado (`billing/catalog?query=...`
    → `planos-comerciais?tab=plans&query=...`, `messages?category=...` →
    `chamados?category=...`, etc.).
  - `clinics/[id]?tab=modules` → `empresas/[id]?tab=modules` confirmado com
    ID real.
  - `billing/subscriptions?clinicId=X` → `empresas/X?tab=billing`
    confirmado.
  - Conta de empresa (Nortex Medical) testada nas 4 rotas compartilhadas
    (`modules`, `messages`, `users`, `audit-logs`): permaneceu exatamente
    na mesma URL em todos os casos, **não** foi redirecionada para nenhuma
    rota canônica do owner — confirma que a navegação de empresa não foi
    afetada.
  - Inspeção visual das 5 páginas novas (screenshots): breadcrumbs corretos
    ("Home / Planos comerciais", "Home / Administração", "Home / Chamados",
    "Home / Empresas / Detalhes"), abas funcionando, conteúdo idêntico ao
    das telas antigas.

## Trabalho remanescente

- Tradução de filtro status/plano no redirect de assinaturas/pagamentos sem
  empresa selecionada (mencionado acima) — pode virar um item pequeno da
  UI-052/053 quando o filtro de status de assinatura fizer sentido na lista
  de Empresas.
- Todos os itens explicitamente atribuídos às tasks seguintes (sidebar,
  conteúdo dos hubs, limpeza de links legados) permanecem no backlog.

## Riscos

- Baixo: nenhuma rota antiga foi removida (ainda funcionam via
  redirecionamento), nenhum componente de conteúdo foi alterado além de um
  único link interno (`tabHref`) e uma tradução de valor de aba
  (`billing`→`overview`, puramente de leitura). RBAC, isolação de tenant e
  Server Actions não foram tocados.
- A rota `/dashboard/empresas/[empresaId]` reaproveita a mesma consulta
  `getPlatformClinicDetails` de antes, sem duplicar query.

## Próxima task sugerida

`UI-050-objective-density-foundation.md` — **aguardando aprovação humana
antes de iniciar**, conforme regra explícita desta fase ("uma task por vez;
cada task migra para tasks/review e aguarda aprovação antes da próxima").
