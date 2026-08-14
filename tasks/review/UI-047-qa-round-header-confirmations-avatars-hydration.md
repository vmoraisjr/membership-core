# UI-047 - QA: Header/Sidebar Cleanup, Confirmação em Chamados, Avatar de Empresa e Fix de Hidratação — Relatório de Implementação

## Objetivo da task

Executar a rodada de QA anexada pelo usuário (`qa-ux review 2.pdf`), com 8
itens: card verde da visão geral, botão de colapsar a sidebar (3ª vez
reportado), rodapé duplicado, tag "Sheep SaaS" no topo, menu de usuário,
confirmação nas ações de chamados, avatar de empresa com logo/iniciais
sólidas, e o erro de hidratação ao entrar no catálogo comercial.

## Arquivos modificados

**1. Card verde da visão geral** (reverte parte da UI-034, que havia
trocado o `PageHeader` por um cabeçalho de texto simples nesta tela
específica — o usuário quer o card de volta só aqui):
- `features/dashboard/components/dashboard-home-page.tsx` — volta a usar
  `PageHeader` (eyebrow/título/descrição/data/ação), em vez do bloco de
  texto solto.

**2. Botão de colapsar a sidebar** (aumentar o alvo, não é mais sobre
z-index/overlap como na UI-036):
- `app/globals.css` — `.sidebar-collapse-toggle` de `size-6` para
  `size-9` (24px → 36px), ajustando o offset (`-right-3` → `-right-4`)
  para manter o centro visual.
- `components/layout/dashboard-sidebar.tsx` — ícone `PanelLeftClose` de
  `size-3.5` para `size-4.5` para acompanhar o botão maior.

**3. Rodapé duplicado** (remove só a coluna esquerda, mantém a
assinatura à direita — é a única parte que o QA circulou):
- `components/branding/app-footer.tsx` — removido o `BrandMark`
  (ícone + "Sheep" + subtítulo); mantido apenas o texto de assinatura à
  direita.

**4 e 5. Tag "Sheep SaaS" e menu de usuário** (refinam a UI-034: o
dropdown já existia com nome/e-mail/versão/sair, faltava tirar o cargo
do botão e adicioná-lo dentro do menu):
- `components/layout/dashboard-header.tsx` — removida a tag/badge
  "Sheep {SaaS|nome do workspace}"; `workspaceBrand` não é mais
  necessário aqui (segue em uso na sidebar).
- `app/(dashboard)/layout.tsx` — parou de passar `workspaceBrand` para
  `DashboardHeader`.
- `components/layout/user-menu.tsx` — botão-gatilho agora mostra só o
  nome (cargo removido); o cargo (`getRoleLabel(role)`) passou a
  aparecer dentro do dropdown, entre o nome e o e-mail.

**6. Confirmação em ações críticas** (a UI-041 já havia auditado o app
inteiro, mas excluiu explicitamente CRM/Contratos/**Mensagens**
("chamados") do escopo — este item fecha essa lacuna específica):
- `features/messages/components/support-threads-page.tsx` — a troca de
  status do chamado (`updateSupportThreadStatusAction`) agora passa por
  `ConfirmSubmitButton` em vez de `<Button type="submit">` direto. As
  chaves de tradução (`updateStatusConfirmTitle`/`Description`) já
  existiam em `messages/pt-BR.json` mas nunca tinham sido usadas — só
  conectei o componente.
- Reauditei o restante do app (ações `delete/cancel/revoke/deactivate/
  suspend/archive` em `features/*/actions`) contra os call-sites: todas
  as demais já usam `ConfirmDialog`/`ConfirmSubmitButton` (clínicas,
  assinaturas, planos, benefícios, pacientes, faturas, usuários,
  convites, uso de benefício). Não modifiquei `features/crm/**`
  (fora do escopo do projeto, ver `CLAUDE.md`) nem
  `features/contracts/components/contracts-page.tsx` (página sem link
  na navegação — não é uma tela alcançável no app atual).

**7. Avatar de empresa** (logo quando disponível; sem gradiente):
- `components/dashboard/company-avatar-mark.tsx` — trocou os 4
  `linear-gradient(...)` por preenchimento sólido (uma cor da paleta por
  hash do nome/seed); ganhou prop opcional `logoUrl` que renderiza uma
  `<img>` sobreposta às iniciais, com `onError` escondendo a imagem e
  revelando o preenchimento sólido de volta (sem precisar de estado/
  client component).
- `features/clinic/components/clinic-table.tsx` — passa
  `logoUrl={clinic.logoUrl}` (campo que já existia na query, só não era
  usado no avatar). Os demais 10 call-sites de `CompanyAvatarMark` já
  ganham o preenchimento sólido automaticamente pela mudança no
  componente compartilhado; não tinham `logoUrl` disponível no escopo
  desta task para ligar (ficam com iniciais).

**8. Erro de hidratação ao abrir o catálogo comercial** — a UI-045
tentou investigar isso sem ferramenta de navegador disponível e concluiu
de forma inconclusiva, atribuindo o erro a cache do Turbopack. Nesta
sessão eu tinha um navegador real disponível e consegui reproduzir o
erro de forma consistente (Playwright, login como Owner Operator →
`/dashboard/modules` → clique em "Abrir catálogo comercial"), tanto em
`next dev` quanto em build de produção (`next build && next start`),
com taxa de falha de ~50% — ou seja, uma condição de corrida real, não
um artefato de cache.

Causa raiz confirmada: o pacote `radix-ui@1.4.3` (usado pelo
`SidePanelTrigger asChild` → `DialogTrigger` → `Primitive.button` →
`Slot`/`SlotClone` no botão "Editar" de cada plano) resolve internamente
uma versão desatualizada e com bug do `@radix-ui/react-slot` (1.2.3),
que gera mismatch de hidratação em `aria-controls`/`id` produzidos por
`useId()` sob React 19.2 — bug documentado publicamente
(`radix-ui/primitives` issues #3700 e #3836). O fix já existe em
`@radix-ui/react-slot@1.2.4+`, mas só chega via uma versão mais nova do
pacote `radix-ui`.

- `apps/web/package.json` — `radix-ui` de `^1.4.3` para `^1.6.7` (dentro
  da mesma major version; `pnpm update radix-ui` dentro do range já
  declarado). Resolve `@radix-ui/react-slot@1.3.3`.
- `pnpm-lock.yaml` — atualizado pelo `pnpm update`.

Validação do fix: 8 execuções consecutivas do fluxo de reprodução acima
contra o build de produção atualizado, **0 falhas** (antes: ~50% de
falha nas mesmas 8 execuções, confirmado antes do update).

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído (após o
  update do `radix-ui`).
- `pnpm test:messages` — ✅ 2 cenários (chamados).
- `pnpm test:modules` — ✅ 4 cenários.
- `pnpm test:billing` — ✅ 7 cenários (cobre o catálogo comercial).
- `pnpm test:users` — ✅ 4 cenários.
- Reprodução manual com Playwright (script descartável, não commitado):
  login real como Owner Operator, navegação clicada
  Módulos → catálogo, 8/8 execuções sem erro de hidratação após o
  update do `radix-ui` (antes do fix: ~4/8 falhas com o erro exato do
  QA).

## Trabalho remanescente

- Os demais 10 call-sites de `CompanyAvatarMark` (usuários, pacientes,
  planos, benefícios, pagamentos, assinaturas, auditoria, uso de
  benefício) continuam sem logo — só ganharam o preenchimento sólido.
  Ligar `logoUrl` neles exige confirmar que cada query já traz esse
  campo (nem todas trazem hoje) — não estava no recorte do QA, que
  apontou especificamente a tela "Empresas clientes".
- Ambiente de dev do usuário: durante a investigação do item 8 eu
  precisei subir um build de produção paralelo (porta 3101) para testar
  com navegador real; o `.next` do dev (porta 3100) e o de produção
  colidiram uma vez no meio do processo (mesma pasta) e o servidor de
  dev precisou ser reiniciado — já deixei o dev server rodando limpo em
  `127.0.0.1:3100` ao final, mas vale um `pnpm dev` manual de
  conferência na próxima vez que for usar o terminal.

## Riscos

- **Médio-baixo**: update do `radix-ui` (`^1.4.3` → `^1.6.7`) é um
  dependency bump de UI usado em ~20 componentes do design system
  (dialog, dropdown, select, tabs, tooltip, etc.). Mitigado por:
  mesma major version (sem breaking change de API esperado pelo
  changelog do Radix), `typecheck`/`lint`/`build` limpos, e as suites de
  regressão que exercitam esses componentes (`billing`, `modules`,
  `users`, `messages`) todas verdes. Não fiz uma varredura visual de
  todos os ~20 componentes Radix do app — só do fluxo que apresentava o
  bug.
- Baixo: demais mudanças são CSS/JSX localizados, sem tocar em schema,
  RBAC ou isolamento de tenant.

## Próxima task sugerida

Backlog (`tasks/backlog/`) está vazio além do README — não há próxima
task pré-definida. Sugestão: varredura visual rápida dos componentes
Radix mais usados (Select, Dropdown, Tabs, Tooltip) após o bump de
versão, e decidir se vale ligar `logoUrl` nos demais call-sites do
avatar de empresa.
