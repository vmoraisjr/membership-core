# UI-002 - App Shell, Navegação e Arquitetura Visual — Relatório de Implementação

## Objetivo da task

Reconstruir a estrutura principal do SaaS: sidebar com logo, navegação agrupada, item ativo, modo recolhido, mobile, usuário e clínica atual; header com breadcrumb, título, contexto, ações e perfil; conteúdo com largura e espaçamentos consistentes.

## Auditoria prévia

O shell (`components/layout/dashboard-sidebar.tsx`, `dashboard-header.tsx`, `app/(dashboard)/layout.tsx`) já cobria a maior parte dos requisitos: logo, agrupamento "Operação", item ativo, modo recolhido (desktop), breadcrumb, título contextual, ações e perfil no header, e largura de conteúdo consistente via `.page-frame`/`--content-max-width`. As lacunas reais eram as apontadas em `docs/frontend-audit.md` §4 e o item de navegação de Módulos:

1. **Sem navegação mobile funcional** — abaixo de `lg`, o `<aside>` completo ficava empilhado em fluxo normal acima do conteúdo (sem drawer/hambúrguer).
2. **"Módulos" ausente da sidebar** — a chave de tradução `navigation.modules` já existia em `messages/pt-BR.json`, mas nenhum item de menu a usava.
3. **Usuário e clínica atual não evidentes na sidebar** — só apareciam no header, e mesmo lá o bloco de usuário fica oculto abaixo de `md`.

## Arquivos criados

- `components/layout/mobile-nav-context.tsx` — contexto React (`MobileNavProvider`/`useMobileNav`) para coordenar o estado aberto/fechado do menu mobile entre `DashboardHeader` (gatilho) e `DashboardSidebar` (conteúdo), já que são componentes irmãos sob um layout de servidor.
- `components/layout/mobile-nav-trigger.tsx` — botão hambúrguer (`lg:hidden`) que abre o menu mobile.

## Arquivos modificados

- `components/layout/dashboard-sidebar.tsx` — reestruturado: a lista de navegação e sua lógica de filtragem por RBAC/escopo foram extraídas para `SidebarNavContent`, reutilizada tanto pelo `<aside>` de desktop (agora `hidden lg:block`, fechando a lacuna de mobile) quanto por um novo painel mobile (`SidePanel` ancorado à esquerda). Adicionado item de navegação **Módulos** (ícone `Blocks`, recurso RBAC `modules`, rótulo `navigation.modules` já existente no i18n). Adicionado bloco de usuário + clínica/plataforma atual no rodapé da navegação (nome, papel e `workspaceBrand.displayName`), visível tanto no desktop quanto no drawer mobile.
- `components/layout/dashboard-header.tsx` — adicionado `<MobileNavTrigger />` antes do bloco de breadcrumb/título.
- `components/ui/side-panel.tsx` — adicionado prop `side?: "left" | "right"` (default `"right"`) a `SidePanelContent`, reaproveitando o primitivo já existente em vez de criar um `Drawer` paralelo.
- `app/(dashboard)/layout.tsx` — envolvido em `<MobileNavProvider>`; `DashboardSidebar` passou a receber `currentUser`.

## Decisões arquiteturais

- **Reuso de `SidePanel` para o drawer mobile** em vez de um novo componente `Drawer`, mantendo o critério "sem biblioteca paralela ao shadcn/ui" fixado na UI-001.
- **"Módulos" adicionado sem `platformOnly`/`clinicOnly`**: o texto da task pede apenas "quando permitido", e a UI-016 (Gestão de Módulos) é quem vai definir o escopo definitivo da tela; por ora o item é gated somente pela permissão RBAC do recurso `modules` (OWNER/ADMIN). Nota: a rota `/dashboard/modules` hoje ainda redireciona para `/dashboard/billing` (achado da UI-000) — a UI-016 deve resolver isso antes deste item ficar funcional de ponta a ponta; documentado como dependência.
- **Bloco de usuário/clínica no rodapé da sidebar** em vez de um novo componente de topo, para não competir visualmente com a marca no cabeçalho da sidebar.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 27 rotas geradas.
- **Verificação em navegador (Playwright, headless Chromium)**: subi o servidor de desenvolvimento (`pnpm dev`, porta 3100) com o Postgres local (`docker compose up -d`) e autentiquei com o usuário semeado `owner+workspace@membership-core.local`.
  - **Desktop (1440px)**: sidebar renderiza (296px de largura), 0 erros de console.
  - **Mobile (375px)**: `<aside>` de desktop corretamente oculto (bounding box `null`); botão hambúrguer visível; clique abre o drawer mobile com a navegação completa (incluindo o novo item "Módulos"), item ativo destacado, e bloco de usuário/plataforma no rodapé ("Owner Operator · Proprietário · Sheep"); 0 erros de console.
  - Screenshots capturadas confirmam o resultado visual (drawer com logo, seção "Operação", itens com ícones, estado ativo em azul).

## Trabalho remanescente

- `/dashboard/modules` continua redirecionando para `/dashboard/billing` (a corrigir na UI-016) — o item de menu "Módulos" hoje leva a essa rota morta até aquela task ser executada nesta mesma sequência.
- `components/layout/breadcrumb-trail.tsx` continua com seu próprio mapa de rótulos em vez do primitivo `Breadcrumb` da UI-001 — não migrado por estar fora do escopo estrito desta task (a estrutura de breadcrumb em si, não a navegação/shell, já funcionava corretamente).

## Riscos

- Baixo: mudanças aditivas ao shell, cobertura verificada em navegador real para os dois breakpoints críticos (desktop/mobile). O único ponto observável é o link "Módulos" apontar para uma rota ainda redirecionada — mitigado por essa mesma sequência de tasks incluir a UI-016.

## Próxima task sugerida

`UI-003-auth-commercial.md`. Servidor de desenvolvimento e banco local mantidos ativos nesta sessão para acelerar a verificação em navegador das próximas tasks.
