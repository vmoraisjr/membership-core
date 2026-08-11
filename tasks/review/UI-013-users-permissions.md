# UI-013 - Usuários e Permissões — Relatório de Implementação

## Objetivo da task

Eliminar a desorganização da gestão de usuários: filtros (clínica, status, perfil, convite); agrupamentos (ativos, pendentes, inativos, convites); fluxos (convidar, copiar link, revogar, alterar perfil, desativar, reativar, remover); último OWNER protegido; visão global somente para plataforma; usuário de clínica não vê outras clínicas.

## Auditoria prévia

Esta era a maior duplicação estrutural do app (UI-000): `UsersOverviewPanel` (clínica, 873 linhas, `<table>` cru) e `PlatformUsersOverviewPanel` (plataforma, 904 linhas, já usando `Table`/`DataTableContainer`) reimplementavam em paralelo os mesmos 4 helpers (`getRoleLabelFromValue`, `getUserStatusLabel`, `getUserStatusClass`, `formatDateInput`). Mais grave: **o fluxo de convite não tinha nenhuma interface**. As Server Actions `submitUserInviteAction` (com redirect de volta trazendo `token`/`email`/`role`/`expiresAt` via query string — desenhada exatamente para exibir um link copiável) e `revokeUserInviteAction` já existiam prontas em `features/users/actions/`, e `getClinicUsersOverview()` já retornava a lista de convites com status calculado (PENDING/ACCEPTED/REVOKED/EXPIRED) — mas nenhum componente chamava essas actions ou renderizava essa lista. O único fluxo de criação de usuário exposto era a criação direta com senha temporária. Confirmei também que a proteção do último OWNER ativo (`assertNotLastActiveOwner`) já estava corretamente implementada no servidor, usada pelas 3 actions de remover/alterar perfil/alterar status — nenhuma mudança foi necessária aí.

## Arquivos criados

- `features/users/utils/user-display.ts` — os 4 helpers antes duplicados, mais `getInviteStatusLabel`/`getInviteStatusTone` para o novo status de convite.
- `features/users/components/invite-user-dialog.tsx` — diálogo de convite (e-mail + perfil), envia via `submitUserInviteAction`.
- `features/users/components/invite-link-banner.tsx` — banner exibido após criar um convite, com o link montado (`/invite?token=...`) e botão "Copiar link" (clipboard).

## Arquivos modificados

- `features/users/components/users-overview-panel.tsx` — reescrita completa: `Tabs` (Ativos/Pendentes/Inativos/Convites, com contadores ao vivo), `<table>` cru substituído por `Table`, status via `StatusIndicator`, nova aba "Convites" com revogação (`revokeUserInviteAction` via `ConfirmSubmitButton`), botão "Convidar usuário" em destaque, formulário de criação direta preservado mas recolhido em `<details>` como alternativa avançada.
- `features/users/components/platform-users-overview-panel.tsx` — os 4 helpers duplicados removidos, agora importados de `user-display.ts`; badge de status migrado para `StatusIndicator`.
- `features/users/components/users-page.tsx` — passou a aceitar `searchParams` e repassar o feedback do convite recém-criado (ou erro) ao painel da clínica.
- `app/(dashboard)/dashboard/users/page.tsx` — passou a resolver e repassar `searchParams` para `UsersPage`.
- `tests/rbac/rbac-hardening.test.ts`, `tests/audit/audit-log-hardening.test.ts` — durante a validação encontrei mais duas chamadas a `cancelBenefitUsageAction` (da UI-010) sem o motivo agora obrigatório; corrigidas da mesma forma que já havia sido feito em `tests/membership` na UI-010. A asserção de metadata em `tests/audit` também foi atualizada para incluir o campo `reason`.

## Decisões arquiteturais

- **Filtro de "Empresa/Clínica" não é um seletor interativo**: já existia como campo desabilitado mostrando a clínica atual — está correto assim, pois "usuário de clínica não vê outras clínicas" é justamente o critério de aceite; um seletor ativo violaria essa regra. A visão global (todas as clínicas) já é exclusiva do painel de plataforma, que não foi alterado estruturalmente.
- **"Pendentes" mapeado para `AppUserStatus.PENDING`, não apenas para convites**: o modelo de dados já cria um `AppUser` com `status: PENDING` no momento em que um convite é emitido (antes mesmo de aceito). A aba "Convites" mostra os registros de `UserInvite` (com token/expiração/revogação); a aba "Pendentes" mostra os `AppUser` correspondentes — são visões complementares da mesma entidade, ambas pedidas explicitamente pela task.
- **Painel de plataforma recebeu apenas o tratamento mínimo seguro** (remoção de duplicação, `StatusIndicator`): usuários de plataforma são criados diretamente (a Server Action de convite lança erro se `currentUser.clinicId` for nulo), então o fluxo de convite não se aplica a esse painel — reestruturá-lo em abas ficaria fora do que os dados suportam sem inventar um conceito nesse contexto. Documentado como decisão de escopo.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 28 rotas geradas.
- `pnpm test:users` — ✅ os 4 cenários passaram, incluindo o ciclo de vida completo de convite (pendente/aceito/revogado/expirado) e a proteção do último owner ativo.
- `pnpm test:rbac` — inicialmente ❌ (chamada legada a `cancelBenefitUsageAction` sem motivo); corrigido e ✅ nos 5 cenários.
- `pnpm test:audit` — inicialmente ❌ (mesma causa + asserção de metadata desatualizada); corrigido e ✅ nos 8 cenários.
- `pnpm test:tenant` — ✅ os 11 cenários de isolamento entre tenants.
- `pnpm test:membership` — ✅ os 4 cenários.
- **Verificação em navegador (Playwright)**: autenticado como `owner+nortex-medical@membership-core.local`. Abas mostram contadores corretos (Ativos 5, Pendentes/Inativos/Convites 0). Cliquei em "Convidar usuário", preenchi um e-mail, enviei — a página recarregou mostrando o banner verde "Convite criado para novo.membro@nortex-demo.local (Proprietário). Válido até 09/08/2026" com o link completo e botão "Copiar link", e as abas atualizaram em tempo real (Pendentes 1, Convites 1). 0 erros de console.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Baixo: a mudança de maior risco (invite flow) reutiliza Server Actions já existentes e testadas (`pnpm test:users` já cobria o ciclo de vida de convite antes desta task, só não havia UI). Os ajustes de teste feitos aqui corrigem uma lacuna deixada na UI-010, não introduzem comportamento novo.

## Próxima task sugerida

`UI-014-clinics-admin.md`.
