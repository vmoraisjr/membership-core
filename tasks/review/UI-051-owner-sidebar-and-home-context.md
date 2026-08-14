# UI-051 — Owner: Sidebar Enxuta e Início Orientado por Contexto — Relatório de Implementação

## Objetivo

Reduzir a sidebar do owner das 9 entradas atuais para 4 itens operacionais
(Início, Empresas, Planos comerciais, Chamados) + uma área secundária
recolhível "Administração" (Equipe Sheep, Auditoria global), e fazer os
atalhos da home apontarem só para rotas canônicas.

## Arquivos modificados

- `components/layout/dashboard-sidebar.tsx`:
  - `items`: removidas as entradas standalone "Catálogo comercial",
    "Assinaturas SaaS", "Pagamentos SaaS" (cobertas agora por "Planos
    comerciais", que aponta para `/dashboard/planos-comerciais`).
    "Empresas clientes" atualizada para `/dashboard/empresas`. "Módulos"
    ganhou `clinicOnly: true` — o owner passa a acessá-lo só via a aba
    "Módulos incluídos" de Planos comerciais (criada na UI-049); empresa
    cliente continua vendo "Módulos" normalmente, sem nenhuma mudança.
    "Equipe Sheep" e "Auditoria global" saíram da seção `operation` e
    viraram uma nova seção `administracao` (`/dashboard/administracao?tab=
    team` / `?tab=audit`).
  - Nova seção `administracao` no render, usando o mesmo mecanismo de
    grupo recolhível já existente (`expandedSections`) — colapsada por
    padrão (diferente de `operation`, que abre por padrão), com botão
    "Mostrar"/"Ocultar" próprio.
  - `active` do item agora compara também a query string (`?tab=...`),
    não só o path — necessário porque os 2 itens de Administração
    apontam para a mesma rota com tabs diferentes; sem isso nenhum dos
    dois nunca ficaria marcado como ativo. Usa `useSearchParams()` (Next
    App Router) ao lado do `usePathname()` já existente.
  - Import `WalletCards` removido (ícone só usado pela entrada
    "Pagamentos SaaS" removida).
- `features/dashboard/components/dashboard-home-page.tsx` — os 5 atalhos
  de "O que precisa de atenção hoje" trocaram de URLs legadas
  (`/dashboard/billing/subscriptions?status=TRIAL`,
  `/dashboard/billing/payments?status=OVERDUE`, `/dashboard/messages?...`,
  `/dashboard/users`, `/dashboard/audit-logs`) para os helpers canônicos
  de `lib/owner-routes.ts` (`empresasUrl`, `chamadosUrl`,
  `administracaoUrl`). "Chamados aguardando plataforma" preserva o filtro
  de status real (`chamadosUrl({ status: "WAITING_PLATFORM" })` — a
  página de Chamados já suporta esse filtro). "Empresas em teste"/"Empresas
  em atraso" apontam para `/dashboard/empresas` sem filtro — o vocabulário
  de status de assinatura SaaS não tem equivalente na lista de empresas
  hoje, e a task deixa explícito que alterar a lógica das tabelas é fora
  de escopo (essa mesma decisão já estava registrada como pendência da
  UI-049).

## Fora do escopo (não alterado)

- Lógica/filtros das tabelas (`ClinicTable` continua sem filtro de status
  de assinatura).
- Conteúdo dos hubs Empresas/Planos comerciais/workspace — UI-052 a
  UI-056.
- Sidebar de usuários vinculados a empresa — nenhuma linha do fluxo
  clinic-scoped foi tocada.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído (sem
  warning de `useSearchParams` fora de Suspense — o layout do dashboard já
  é `force-dynamic`, então não há tentativa de renderização estática ali).
- Playwright contra build de produção, login real:
  - **Owner, desktop (1440px)**: sidebar mostra exatamente 4 itens
    operacionais (`["Visão geral","Empresas clientes","Planos
    comerciais","Chamados"]`, confirmado via `allTextContents()`) — bate
    com o critério de aceite "no máximo quatro itens antes de
    Administração". Expandir "Administração" e clicar "Equipe Sheep"
    navega para `/dashboard/administracao?tab=team` com o item
    corretamente marcado ativo.
  - **Owner, sidebar recolhida**: os 6 ícones (4 operação + 2
    administração) renderizam certo, breadcrumb e conteúdo da aba
    corretos.
  - **Owner, mobile (390px)**: drawer mostra os mesmos 4 itens + grupo
    "ADMINISTRAÇÃO" colapsado com botão "MOSTRAR".
  - **Empresa cliente (Nortex Medical)**: confirmado que o texto
    "Administração"/"Equipe Sheep"/"Auditoria global" **não aparece em
    lugar nenhum da página** — nenhum vazamento das entradas de governança
    da plataforma para uma conta de empresa. `/dashboard/modules`
    continua acessível e funcional para essa conta, sem redirecionamento
    (confirma que o `clinicOnly: true` novo não quebrou o acesso da
    empresa ao próprio Módulos).

## Critérios de aceite

- ✅ Owner enxerga no máximo 4 itens operacionais antes de Administração.
- ✅ Nenhum atalho da home leva a rota legada (todos os 5 usam os helpers
  canônicos de `lib/owner-routes.ts`).
- ✅ Cada alerta da home leva direto ao destino contextual certo
  (Empresas, Chamados filtrado, Administração > Equipe, Administração >
  Auditoria).
- ✅ Navegação de usuários vinculados a empresa permanece inalterada
  (confirmado ao vivo).

## Riscos

- Baixo: a única lógica nova e não-trivial é o cálculo de `active`
  considerando query string — testado ao vivo (clique real + verificação
  de classe ativa via navegação/URL resultante), não só por leitura de
  código.

## Próxima task

`UI-052-commercial-plans-hub.md` — seguindo em sequência.
