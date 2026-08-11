# UI-034 - Dashboard: Hero Simples e Menu de Usuário Único — Relatório de Implementação

## Objetivo da task

Simplificar o cabeçalho "Boa noite, Owner" (tirar do card flutuante,
remover botão "Ver contas em atraso") e consolidar a informação de
usuário duplicada num único menu suspenso no topo.

## Arquivos modificados

- `features/dashboard/components/dashboard-home-page.tsx` — `PageHeader`
  trocado por um cabeçalho de texto simples (eyebrow + título + descrição
  + data, sem card/wash), só para esta tela. Botão "Ver contas em atraso"
  removido (junto com `canManageBilling`, que só existia para esse
  botão). Botão "Criar assinatura" (visão clínica) mantido, sem card.
- `components/layout/user-menu.tsx` (novo) — menu suspenso client-side
  (`DropdownMenu`) com nome/e-mail do usuário, versão do sistema (`0.1.0`,
  constante local) e ação "Sair" (antes um botão solto ao lado do chip).
- `components/layout/dashboard-header.tsx` — troca o bloco de usuário +
  botão "Sair" pelo novo `<UserMenu>`.
- `components/layout/dashboard-sidebar.tsx` — removido o bloco
  `sidebar-foot` (avatar + nome + cargo no rodapé da sidebar), que
  duplicava a mesma informação agora só no menu do topo. Limpeza:
  `currentUser` parou de ser repassado a `SidebarNavContent` (não é mais
  usado ali) e o import de `getRoleLabel` foi removido.

## Decisões arquiteturais

- **`DropdownMenu` isolado num componente client novo** (`user-menu.tsx`)
  em vez de marcar `DashboardHeader` inteiro como `"use client"` — o
  header segue server component, só o menu (que precisa de estado de
  aberto/fechado) é client. Evita perder a renderização no servidor do
  resto do header.
- **`Props.currentUser` de `DashboardSidebar` não foi removido** — ainda é
  passado pelo `layout.tsx` e faz parte do contrato público do
  componente; só o uso interno (agora desnecessário) foi limpo.
- **Versão do sistema hardcoded como `"0.1.0"`** (igual ao
  `package.json`) — não importei o `package.json` para dentro de um
  componente client para não empacotar metadata desnecessária no bundle.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings (2 warnings de variável não usada
  corrigidos durante a implementação).
- `pnpm --dir apps/web build` — ✅ build de produção concluído.

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Baixo: `logoutAction` continua funcionando (só mudou de lugar, agora
  dentro do dropdown); nenhuma mudança de RBAC/permissão.

## Próxima task sugerida

`UI-035-dashboard-panorama-cleanup.md`.
