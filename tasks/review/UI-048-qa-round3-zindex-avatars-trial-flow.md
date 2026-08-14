# UI-048 - QA: Z-index da Sidebar, Avatar Logo/Iniciais, Paginação de Auditoria, Painéis Reestruturados e Fluxo de Período de Testes — Relatório de Implementação

## Objetivo da task

Executar a 3ª rodada de QA anexada pelo usuário (`qa-ux review 3.pdf`), com 8
itens: botão de colapsar a sidebar ainda atrás do header, regra de
avatar (logo OU iniciais, nunca os dois, fundo branco), remover "+" do
botão "Novo plano", aplicar a regra do avatar em Assinaturas SaaS,
paginação da auditoria global + botão que estourava a tela, painel de
detalhes de assinatura desatualizado, ações de senha para usuários de
empresas, formulário de editar empresa "antigo", e reestruturação da
ação de período de testes com geração automática da próxima parcela.

## 1. Botão de colapsar ainda atrás do header — causa raiz real

A UI-036 (sessão anterior) tinha corrigido `z-30` no elemento
`.app-shell-sidebar-sticky` e no próprio botão, mas o QA confirmou que o
problema persistia. Investigação por análise de stacking context (sem
navegador nessa etapa) encontrou a causa real: `.app-shell-sidebar` (o
`<aside>`, avô do botão) usa `backdrop-blur-xl` — `backdrop-filter`
força a criação de um novo *stacking context* mesmo com `position:
static`, e como esse elemento não tem `z-index` próprio, todo o
subtree (incluindo os `z-30` internos) fica preso no nível 0 do
contexto raiz, perdendo para o `.app-shell-header` (`position: sticky`
+ `z-index: 20`, um nível positivo real).

- `app/globals.css` — `.app-shell-sidebar` ganhou `relative z-30`
  diretamente (antes só o filho `.app-shell-sidebar-sticky` tinha).
  Confirmado visualmente via Playwright: o botão aparece completo,
  sem sobreposição do header.

## 2. Avatar: logo OU iniciais, nunca sobrepostos; fundo branco

- `components/dashboard/company-avatar-mark.tsx` — reescrito:
  removido o preenchimento sólido colorido (`FILL_COLORS`/`hashString`,
  introduzidos na UI-047); agora é sempre um círculo branco com borda
  cinza clara e iniciais em cinza bem claro (`text-slate-300
  border-slate-200`). Quando há `logoUrl`, uma camada com fundo branco
  cobre completamente as iniciais mostrando só a logo
  (`object-contain`, com padding); se a imagem falhar ao carregar
  (`onError`), a camada some e as iniciais voltam a aparecer — mantém
  o fallback sem precisar de estado React.
- **Bug real encontrado e corrigido**: o componente usa `onError` (um
  event handler) mas não tinha `"use client"`. Isso é inofensivo
  quando renderizado a partir de uma árvore que já é client (ex.:
  `clinic-table.tsx`), mas quebra com "Event handlers cannot be
  passed to Client Component props" quando renderizado direto de um
  Server Component — reproduzido ao vivo em
  `/dashboard/billing/subscriptions` (Server Component), que ficava
  com a tela inteira em erro. Corrigido adicionando `"use client"` ao
  topo do arquivo.

## 3. Botão "Novo plano" sem o ícone "+"

- `features/billing/components/platform-plan-side-panel.tsx` —
  removido o `<Plus className="size-4" />` do `defaultTrigger` (e o
  import não usado de `lucide-react`).

## 4. Avatar com logo em Assinaturas SaaS

- `features/billing/services/billing-foundation.ts` — a query de
  `getPlatformClinicBillingOverview` passou a selecionar
  `clinic.logoUrl`.
- `features/billing/components/platform-saas-subscriptions-page.tsx`
  — `CompanyAvatarMark` da fila de assinaturas agora recebe
  `logoUrl={subscription.clinic.logoUrl}`.

## 5. Auditoria global: paginação + botão que estourava a tela

- `features/audit-log/services/get-audit-logs.ts` — `AuditLogFilters`
  ganhou `page`/`pageSize` (`5 | 10 | 30 | "all"`, default `10`); a
  query de logs usa `skip`/`take` (sem paginação quando `"all"`); uma
  segunda query (`prisma.auditLog.count`) traz o total. Antes a lista
  era limitada a `take: 200` fixo, sem nenhum controle de página.
- `app/(dashboard)/dashboard/audit-logs/page.tsx` — lê `page`/`pageSize`
  da URL.
- `features/audit-log/components/audit-log-page.tsx` — repassa
  `total`/`page`/`pageSize` para a tabela.
- `features/audit-log/components/audit-log-table.tsx` — novo `<Select
  name="pageSize">` (5/10/30/Tudo) no formulário de filtros; rodapé
  novo com "Exibindo X–Y de Z registros" e navegação Anterior/Próxima
  (via `Link`, preservando os filtros atuais). O botão "Limpar" que
  ficava cortado ao lado de "Extrair CSV" foi corrigido: os 3 botões
  de ação passaram de uma célula fixa do grid `lg:grid-cols-6` para
  uma linha própria `flex flex-wrap` de largura total
  (`lg:col-span-full`).
- `messages/pt-BR.json` — chaves novas em `audit.filters.pageSize`/
  `pageSizeAll` e `audit.pagination.*`.

## 6. Painel de detalhes de assinatura reestruturado + workspace completo

- `features/billing/components/saas-subscription-details-panel.tsx`
  — trocado o layout de caixas `.detail-field` (visual "formulário")
  por blocos ícone+rótulo+valor (mesmo padrão do
  `ClinicQuickViewPanel`), com o status da assinatura em
  `StatusIndicator` (badge colorido) em vez de texto puro. Ganhou
  `clinicId`/`statusTone` como props novas e um botão "Abrir workspace
  completo" (`/dashboard/clinics/{clinicId}`) — o link já existia em
  outros dois lugares do app (`clinic-row-actions.tsx`,
  `clinic-quick-view-panel.tsx`), só faltava aqui.
- `features/billing/components/platform-saas-subscriptions-page.tsx`
  — repassa `clinicId` e `statusTone` (via
  `getClinicSubscriptionStatusTone`, já usado no restante da página).

## 7. Ações de senha para usuários de empresas

A aba "Usuários" do workspace da empresa
(`platform-clinic-details-page.tsx`, seção "Master da empresa" — só
lista o usuário master, escopo pré-existente da query) não tinha
nenhuma ação. "Restaurar senha" já existia (em outro contexto: no
próprio "Editar empresa"), mas "enviar senha por e-mail" não existia
de forma genérica — só para o master via
`sendClinicMasterPasswordEmailAction`, que faz um lookup específico do
master, não aceita um `userId` arbitrário.

- `features/clinic/actions/reset-company-user-password.ts` (novo) —
  ação plataforma-only que reseta a senha de qualquer usuário de
  empresa (mesmo padrão de `resetClinicMasterPasswordAction`, mas
  genérico por `userId`).
- `features/clinic/actions/send-company-user-password-email.ts`
  (novo) — mesmo padrão de `sendClinicMasterPasswordEmailAction`,
  genérico por `userId`. Envio real de e-mail continua não
  implementado (placeholder pré-existente no restante do app) —
  retorna a senha temporária para cópia manual.
- `features/clinic/components/company-user-password-actions.tsx`
  (novo, client) — botões "Restaurar senha" / "Enviar senha" com campo
  de senha temporária mascarável, reaproveitando visualmente o padrão
  de `clinic-dialog.tsx`.
- `features/clinic/components/platform-clinic-details-page.tsx` —
  nova coluna "Ações" na tabela de usuários da empresa.

## 8. Formulário de editar empresa "antigo" + fluxo de período de testes

**Refinamento visual (baixo risco, aditivo):**
- `components/ui/form-section.tsx` — nova prop opcional `subtle`
  (default `false`, não muda nenhum dos outros 6 usos existentes de
  `FormSection` no app). Quando ativa, troca a caixa pesada
  (`border-border/70` + fundo preenchido) por uma versão mais leve
  (`border-border/40`, sem preenchimento).
- `features/clinic/components/clinic-dialog.tsx` — todas as 6 seções
  do formulário usam `subtle`; as caixas aninhadas `.detail-field`
  dentro de "Status, plano e módulos" e "Plano inicial" viraram texto
  simples (sem caixa dupla).

**Fluxo de período de testes (reestruturação funcional):**
- `prisma/schema.prisma` — **nenhuma migração necessária**: o campo
  `ClinicSubscription.trialEndsAt` já existia, só não era escrito na
  transição manual para `TRIAL` (só era setado no provisionamento
  inicial).
- `features/billing/services/billing-foundation.ts` —
  `updateClinicSubscriptionStatus` ganhou `trialEndsAt?: Date`
  opcional. Quando a transição é para `TRIAL` com uma data informada:
  grava `trialEndsAt`/`expiresAt` com a data escolhida e gera a
  próxima fatura via `createClinicInvoiceForSubscription` (mesma
  função já usada na primeira fatura do provisionamento), com
  vencimento na data de encerramento do teste — fica visível na lista
  de pagamentos da empresa automaticamente, sem lógica nova de
  faturamento.
- `features/billing/actions/platform-manage-clinic-subscription.ts` —
  `platformUpdateClinicSubscriptionStatusAction` lê `trialEndsAt` do
  FormData e exige a data quando o status alvo é `TRIAL` (erro
  explícito se ausente).
- `components/dashboard/confirm-dialog.tsx` — ganhou 3 props
  aditivas e opcionais (`detailsType`, `detailsDefaultValue`) para
  suportar um campo de data no fluxo de confirmação (nenhum dos ~10
  usos existentes do componente passa essas props, comportamento
  idêntico para eles).
- `features/billing/components/activate-trial-submit-button.tsx`
  (novo) — variante do `ConfirmSubmitButton` com campo de data
  obrigatório (`detailsInput="input" detailsType="date"`), pré-preenchido
  com hoje + `trialDays` do plano atual; ao confirmar, escreve a data
  no `<input type="hidden" name="trialEndsAt">` do formulário e
  submete.
- `features/billing/components/platform-saas-subscriptions-page.tsx`
  — a ação "Enviar para trial" (renomeada para "Ativar período de
  testes") usa o novo botão só para o status `TRIAL`; as outras 3
  ações (ativar, suspender, cancelar) continuam com
  `ConfirmSubmitButton` normal. A coluna "Vigência" já mostrava
  "Trial até" quando `trialEndsAt` existe — nenhuma mudança adicional
  necessária ali, ela passa a refletir a data escolhida
  automaticamente.
- `messages/pt-BR.json` — `billing.actions.sendToTrial` alterado de
  "Enviar para trial" para "Ativar período de testes".

Observação: a ação "Ativar período de testes" só fica disponível
quando a assinatura está em `PENDING` (regra de transição
pré-existente, não alterada); nenhuma das 4 contas do seed atual está
nesse estado, então o fluxo completo não pôde ser clicado ponta a
ponta no navegador nesta sessão — validado por leitura de código e
pela suíte automatizada (`test:billing`, cenário "manual SaaS
lifecycle transitions are explicit").

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:billing` — ✅ 7 cenários.
- `pnpm test:audit` — ✅ 8 cenários.
- `pnpm test:users` — ✅ 4 cenários.
- `pnpm test:clinic-bootstrap` — ✅ 8 cenários (inclui reset de senha
  do master, área adjacente às ações novas do item 7).
- `pnpm test:modules` — ✅ 4 cenários.
- `pnpm test:rbac` — ✅ 5 cenários.
- `pnpm test:tenant` — ✅ 11 cenários.
- Verificação visual ao vivo (Playwright + login real como Owner
  Operator): confirmado o botão de colapsar acima do header, avatares
  com fundo branco/logo em `/dashboard/clinics`, paginação da
  auditoria em `/dashboard/audit-logs`, e a página
  `/dashboard/billing/subscriptions` — que estava quebrando 100% do
  tempo até o fix do item 2 (bug do `"use client"` ausente).

## Trabalho remanescente

- O fluxo "Ativar período de testes" não foi exercitado ponta a ponta
  no navegador (nenhuma conta em `PENDING` no ambiente local) — vale
  uma verificação manual da primeira vez que uma conta nova passar por
  esse estado.
- "Enviar senha por e-mail" continua sendo um placeholder em todo o
  app (não só no que foi adicionado agora) — não há envio real de
  e-mail configurado; isso já era uma limitação conhecida antes desta
  task.

## Riscos

- Baixo: `FormSection subtle` e as 3 novas props do `ConfirmDialog`
  são estritamente aditivas — os ~15 usos existentes desses dois
  componentes compartilhados não passam essas props e mantêm o
  comportamento/visual anterior exatamente igual (confirmado por
  `typecheck`+`lint`+`build`+suítes automatizadas, que exercitam vários
  desses call-sites).
- Baixo-médio: a geração automática da próxima parcela ao ativar
  período de testes é lógica de billing nova (antes só rodava no
  provisionamento inicial); reaproveita a função já testada
  `createClinicInvoiceForSubscription` em vez de escrever criação de
  fatura do zero, reduzindo a superfície de risco.

## Próxima task sugerida

Backlog (`tasks/backlog/`) segue vazio além do README. Sugestão:
validar manualmente o fluxo de período de testes assim que houver uma
conta em `PENDING`, e decidir se vale conectar `logoUrl` nos demais
call-sites do `CompanyAvatarMark` (usuários, pacientes, planos,
benefícios, pagamentos) fora do escopo desta rodada de QA.
