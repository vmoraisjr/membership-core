# UI-034 - Dashboard: Hero Simples e Menu de Usuário Único

## Objetivo da task

Simplificar o cabeçalho "Boa noite, Owner" (tirar do formato card
flutuante, remover botão "Ver contas em atraso") e consolidar a
informação de usuário duplicada (topo-direita e rodapé da sidebar) num
único menu suspenso no topo.

## Auditoria prévia (já feita)

Ver `docs/qa-ux-review-2026-08.md`, itens 4.2 e 4.3.

- Hero: `features/dashboard/components/dashboard-home-page.tsx`, uso do
  `PageHeader` com `action=` renderizando o botão "Ver contas em atraso"
  (`dashboard.primaryAction.platform`). O `.workspace-header` (card com
  wash) é compartilhado por todas as páginas — **não** dá para só tirar o
  card genericamente sem afetar as outras 20 telas; para esta tela
  especificamente, a solução é não usar `PageHeader`/`.workspace-header`
  e sim um cabeçalho de texto simples (título + descrição, sem card),
  já que é a única pedida explicitamente para isso.
- Duplicação de usuário: `components/layout/dashboard-header.tsx` (chip
  no topo) e `components/layout/dashboard-sidebar.tsx` (`sidebar-foot`,
  rodapé da sidebar) mostram o mesmo "Owner Operator · Proprietário".

## Escopo

- Dashboard (`dashboard-home-page.tsx`): substituir o `PageHeader` por um
  cabeçalho de texto simples (sem `.workspace-header` card/wash), remover
  o botão "Ver contas em atraso" do cabeçalho (a informação de atraso já
  está coberta pela seção "O que precisa de atenção hoje", mantida).
- `DashboardHeader`: transformar o chip de usuário do topo num menu
  suspenso (`DropdownMenu`, já existe em `components/ui/dropdown-menu.tsx`)
  com nome/e-mail, versão do sistema, e o botão "Sair" (hoje solto ao
  lado do chip).
- `dashboard-sidebar.tsx`: remover o bloco `sidebar-foot` (usuário no
  rodapé), já que a informação passa a viver só no menu do topo.

## Critérios de aceite

- "Boa noite, Owner" aparece como texto simples, sem card/wash, sem botão
  de atraso.
- Informação de usuário aparece uma única vez, no menu suspenso do topo.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.

## Restrições

- Não remover a funcionalidade de sair (`logoutAction`) nem a
  informação de versão — só consolidar onde aparecem.
- Não alterar `PageHeader`/`.workspace-header` globalmente — a mudança do
  hero é específica desta tela.
