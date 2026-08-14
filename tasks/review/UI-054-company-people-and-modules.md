# UI-054 — Workspace Empresa: Pessoas e Módulos — Relatório de Implementação

## Objetivo

Completar a gestão operacional de uma empresa dentro do seu workspace —
transformar a aba "Pessoas" em CRUD completo dos usuários da empresa
(não só o master) e consolidar a aba "Módulos", sem misturar usuários
internos Sheep com usuários da conta cliente e sem sair da empresa para
nenhuma dessas ações.

## Arquivos criados

- `features/clinic/actions/manage-company-users.ts` — 6 Server Actions
  com guarda de plataforma (`assertPlatformCanManageCompanyUsers`:
  `assertPermission("clinic","manage")` + usuário sem `clinicId` próprio
  + role OWNER/ADMIN) e `clinicId` explícito vindo do FormData, não do
  usuário logado: `createCompanyUserAction`,
  `updateCompanyUserDetailsAction`, `updateCompanyUserStatusAction`,
  `removeCompanyUserAction`, `inviteCompanyUserAction`,
  `revokeCompanyUserInviteAction`. Cada uma espelha a lógica da action
  self-service equivalente em `features/users/actions/*`, reaproveitando
  sem modificação `assertUserIsNotClinicMaster`/`assertNotLastActiveOwner`
  (já recebem `clinicId` como parâmetro) e `canAssignRole`; convite usa
  `createUserInvite` diretamente, contornando o wrapper
  `submitUserInviteAction` (que assume o `clinicId` do usuário logado).
- `features/clinic/components/company-people-tab.tsx` — server component:
  busca `getPlatformClinicUsersOverview(clinicId)` +
  `getAssignableRoles(role)`, entrega para o painel client.
- `features/clinic/components/company-people-panel.tsx` — painel client
  completo: tabela de todos os usuários (nome/e-mail/papel/status/último
  acesso) com ações por linha (editar, ativar/desativar via
  `ConfirmSubmitButton`, remover via `ConfirmSubmitButton`,
  `CompanyUserPasswordActions` para resetar/enviar senha), diálogo
  "Adicionar usuário" (cria com senha temporária exibida), lista de
  convites pendentes com revogar. Linha do usuário master mostra texto
  somente-leitura ("Gerencie pelo painel &ldquo;Editar empresa&rdquo;")
  em vez de ações — ele já é administrado pelo fluxo de edição da
  empresa, não duplicado aqui.
- `features/clinic/components/company-user-password-actions.tsx` +
  `features/clinic/actions/reset-company-user-password.ts` +
  `features/clinic/actions/send-company-user-password-email.ts` —
  variantes com guarda de plataforma e `clinicId` explícito das ações de
  credencial já existentes para o fluxo self-service.

## Arquivos modificados

- `features/users/services/get-clinic-users-overview.ts` — lógica
  interna extraída para `fetchClinicUsersOverview(clinicId)` privada;
  `getClinicUsersOverview()` (self-service, via `getCurrentClinicId()`)
  e nova `getPlatformClinicUsersOverview(clinicId)` (plataforma, param
  explícito) viraram wrappers finos da mesma função — uma fonte de
  verdade só, dois pontos de entrada com escopo diferente.
- `features/clinic/components/platform-clinic-details-page.tsx` — aba
  "Usuários" renomeada para "Pessoas"; bloco antigo (tabela só do
  master) substituído por `<CompanyPeopleTab clinicId={clinicId} />`;
  imports não usados removidos (`getUserStatusLabel`,
  `getUserStatusTone`).
- `messages/pt-BR.json` — `clinics.details.modulesDescription`
  estendida: módulo Membership vem incluído em todo plano comercial (ver
  Planos comerciais); os demais, quando disponíveis, são exceções
  operacionais habilitadas manualmente na aba Módulos — deixa explícito
  que a aba não duplica a definição de oferta.

## Fora do escopo (não alterado)

- Matriz de permissões (`canAssignRole`, `assertPermission`) — só
  reaproveitada, nunca modificada.
- Ativação de módulos futuros/não suportados na V1 — aba Módulos segue
  somente leitura para tudo além de Membership.
- Regra de cobrança de módulos.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros (1 erro de
  `react/no-unescaped-entities` corrigido durante o desenvolvimento,
  aspas literais trocadas por `&ldquo;`/`&rdquo;`).
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:users` — ✅ sem regressão.
- `pnpm test:modules` — ✅ sem regressão.
- `pnpm test:tenant` — ✅ sem regressão.
- `pnpm test:rbac` — ✅ sem regressão.
- `pnpm test:audit` — ✅ sem regressão.
- Playwright contra build de produção, login real como Owner Operator,
  aba Pessoas de uma empresa:
  - Tabela mostra todos os usuários da empresa (não só o master).
  - "Adicionar usuário" cria com senha temporária exibida em campo
    somente-leitura; contagem de linhas confirmada 1 → 2 após criação.
  - Ação "Desativar" abre confirmação, aplica a transição de status.
  - Ação "Remover" limpa o usuário de teste; contagem volta 2 → 1.
  - Linha do master mostra o texto explicativo em vez de botões de ação
    (confirma que a plataforma não pode remover/desativar o master por
    aqui).
  - Aba "Módulos" renderiza a descrição atualizada distinguindo módulo
    incluído no plano (Membership) de exceções operacionais, com tabela
    de status/disponibilidade/ações por módulo.

## Critérios de aceite

- ✅ A aba Pessoas mostra todos os usuários da empresa, não apenas o
  master — confirmado ao vivo.
- ✅ Guarda de plataforma (`assertPlatformCanManageCompanyUsers`) previne
  ação fora da empresa alvo: `clinicId` é sempre explícito no FormData e
  validado contra o usuário-alvo antes de qualquer mutação, reaproveitando
  as mesmas proteções de role/last-owner do fluxo self-service.
- ✅ Nenhum motivo operacional para abrir Equipe Sheep ao gerenciar uma
  empresa cliente — CRUD completo vive na aba Pessoas do workspace.
- ✅ Aba Módulos não duplica a definição de oferta: texto explícito
  aponta para Planos comerciais como fonte da inclusão de módulos.

## Riscos

- Baixo: as 6 novas Server Actions duplicam a *forma* (assinatura,
  guarda) das actions self-service mas não a lógica de validação
  (reaproveitada via `manage-clinic-user.ts`), reduzindo risco de
  divergência futura entre os dois fluxos.
- Baixo: `getClinicUsersOverview` refatorada para wrapper — coberta por
  `test:users` sem regressão, comportamento self-service inalterado.

## Próxima task

`UI-055-company-contextual-support.md` — seguindo em sequência.
