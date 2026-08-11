# UI-018 - Estados Globais e Feedback — Relatório de Implementação

## Objetivo da task

Padronizar respostas visuais. Abranger loading, skeleton, vazio, sem resultados, erro, sucesso, bloqueado, sem permissão, offline, sessão expirada, confirmação e processamento. Implementar mensagens pt-BR, toasts consistentes, prevenção de dupla submissão, botões loading e retry. Critérios de aceite: nenhuma tela branca, nenhuma ação sem feedback, erros técnicos não expostos.

## Auditoria prévia

A maior parte da lista de estados já estava bem coberta, construída incrementalmente ao longo das 17 tasks anteriores: `Skeleton`/`PageSkeleton` (loading), `EmptyState` (vazio/sem resultados, com variações "noResultsTitle/Description" já usadas em várias tabelas), `AccessDenied` (sem permissão), `ClinicAssignmentRequired`/`ClinicPlanActivationRequired` (bloqueado por falta de vínculo ou assinatura SaaS inativa), `sonner` (toasts, já usado de forma consistente com `toast.success`/`toast.error` em todo o app), `app/(dashboard)/dashboard/loading.tsx` (usa `PageSkeleton`), `app/(dashboard)/error.tsx` (boundary com retry e texto pt-BR, sem expor mensagem técnica do erro), e detecção de sessão expirada na tela de login (UI-003, via parâmetro `next`).

Quatro lacunas reais, todas batendo diretamente nos critérios de aceite:

1. **`app/global-error.tsx` era uma tela em inglês, sem marca Sheep**, com cores Tailwind literais (`slate-950`) em vez dos tokens do Design System — o único ponto do app inteiro que ainda "quebrava" a identidade visual e o idioma em caso de falha catastrófica (erro no próprio root layout). Como esse arquivo substitui o `<html>`/`<body>` inteiro, ele nem importava `globals.css` — nenhum token de cor funcionaria mesmo se eu tentasse usá-los sem corrigir isso.
2. **Não havia `error.tsx` na raiz do app.** Só o grupo `(dashboard)` tinha um boundary próprio; um erro em `(auth)/login`, `/first-access`, `/invite` etc. pulava direto para o `global-error.tsx` — a tela genérica em inglês do item acima.
3. **Não havia `not-found.tsx`.** Qualquer rota inexistente caía no 404 padrão do Next.js, sem marca, sem pt-BR — uma "tela branca" na prática para o usuário final.
4. **`ConfirmDialog` — o componente usado por praticamente toda ação destrutiva ou crítica do sistema (15 arquivos, dezenas de chamadas: desativar clínica, cancelar assinatura, remover usuário, desabilitar módulo, etc.) — não tinha nenhuma proteção contra dupla submissão nem estado de carregamento no próprio botão de confirmação.** O botão de ação (`AlertDialogAction`) apenas disparava `onConfirm` e o Radix fechava o diálogo instantaneamente, sem aguardar a Server Action terminar; nada impedia reabrir o diálogo e confirmar de novo enquanto a primeira chamada ainda estava em voo.

## Arquivos criados

- `app/error.tsx` — boundary de erro para tudo que não está sob `(dashboard)` (grupo `(auth)`, páginas soltas), com o mesmo tratamento visual do boundary do dashboard: cartão centralizado, texto pt-BR, botão "Tentar novamente" usando o componente `Button`, sem expor `error.message`/stack.
- `app/not-found.tsx` — 404 com marca e mensagem em pt-BR, com botão "Voltar para o painel".
- `components/layout/offline-banner.tsx` — faixa fixa no topo, exibida quando o navegador perde conexão (eventos `online`/`offline` do `window`), com ícone e mensagem em pt-BR. Nenhuma tela do app tinha qualquer feedback de perda de conectividade antes.

## Arquivos modificados

- `components/dashboard/confirm-dialog.tsx` — núcleo da correção de "prevenção de dupla submissão" e "botões loading": `onConfirm` agora é aguardado (`await`) dentro de um estado `isSubmitting`; enquanto em andamento, os botões Cancelar e Confirmar ficam desabilitados, o rótulo do botão de confirmação muda para "Processando..." (reaproveitando `shared.actions.processing`, já existente), e o diálogo não pode ser fechado (ESC, clique fora, reabertura) até a operação terminar. O botão de confirmação deixou de usar `AlertDialogAction` (que fechava o diálogo de forma síncrona e imediata, sem permitir mostrar o estado de carregamento) e passou a ser um `Button` controlado manualmente, mantendo o mesmo visual. Nenhuma chamada existente precisou mudar de assinatura — `onConfirm` aceitava e continua aceitando funções síncronas ou assíncronas.
- `app/global-error.tsx` — reescrito: importa `./globals.css` (necessário porque este arquivo substitui o layout raiz e antes não carregava nenhum token de estilo), usa `SHEEP_BRAND_SIGNATURE` e os textos de `errors.global.*`, mantendo `lang="pt-BR"`.
- `app/(dashboard)/error.tsx` — o `<button>` cru foi trocado pelo componente `Button` do Design System (única alteração; o texto e a lógica já estavam corretos).
- `app/layout.tsx` — monta `<OfflineBanner />` globalmente, antes do conteúdo da página.
- `messages/pt-BR.json` — novos blocos `errors.global.*`, `errors.notFound.*` e `offline.*`.

## Decisões arquiteturais

- **A correção de dupla submissão foi feita uma única vez, no componente central `ConfirmDialog`, não em cada um dos ~15 arquivos que o usam.** Isso evita duplicar a mesma lógica de `isPending`/`disabled` dezenas de vezes pelo código (proibido pelas regras permanentes) e cobre de uma vez só toda ação crítica do sistema — incluindo as construídas em tasks anteriores (UI-005 a UI-017) sem que elas precisassem ser tocadas.
- **Diálogos baseados em React Hook Form (paciente, plano, assinatura, clínica) não foram alterados.** Eles já implementavam seu próprio controle de estado de envio via `form.formState.isSubmitting` desde a UI-007, com o mesmo padrão de botão "Processando..." — mexer neles duplicaria uma solução que já funciona corretamente.
- **`global-error.tsx` manteve um `<button>` HTML puro em vez do componente `Button`.** Esse arquivo substitui o layout raiz inteiro (é o único ponto do Next.js App Router que roda fora de qualquer Provider), então evitei introduzir uma dependência de componente com mais superfície (variantes `cva`, `Slot` do Radix) nesse contexto especial de última instância — o botão usa os mesmos tokens de cor do Design System (`bg-foreground`/`text-background`), preservando a identidade visual sem risco adicional nesse ponto crítico.
- **"Bloqueado" (assinatura SaaS suspensa/cancelada) já tinha uma tela dedicada** (`ClinicPlanActivationRequired`, usada por `renderOperationalClinicScopedPage`) — nenhuma mudança foi necessária.
- **"Sessão expirada" já estava implementada na tela de login (UI-003)** — nenhuma mudança foi necessária; apenas confirmei que o fluxo `next=` continua intacto.
- **Filtro de período do log de auditoria e outras varreduras de "sem resultados"** não fazem parte desta task — cada tabela já tem sua própria mensagem de "nenhum resultado encontrado" via `EmptyState`, construída task a task; não havia um padrão quebrado a corrigir aqui.

## Bug encontrado e corrigido durante a verificação

Ao implementar o `OfflineBanner`, o primeiro código usava `typeof navigator !== "undefined"` como guarda para inicializar o estado a partir de `navigator.onLine`. Isso causou um erro de hidratação real: desde o Node.js 21, existe um objeto `navigator` global no servidor (usado para `navigator.userAgent` em chamadas `fetch`), mas ele **não** tem a propriedade `onLine` — `navigator.onLine` avalia para `undefined` no servidor, e `!undefined` é `true`, fazendo o servidor renderizar a faixa "offline" sempre, mesmo com a aplicação online. O cliente, com um `navigator.onLine` real, renderizava sem a faixa — divergência detectada pelo React como erro de hidratação em toda navegação inicial. Corrigido validando também `typeof navigator.onLine === "boolean"` antes de negar o valor. Confirmado via Playwright que o erro de hidratação desapareceu após a correção.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings (inclusive após corrigir um erro do `react-hooks/set-state-in-effect` no primeiro rascunho do `OfflineBanner`).
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 29 rotas geradas (nova rota estática `/_not-found`).
- `pnpm test:tenant`, `test:rbac`, `test:membership`, `test:billing`, `test:users`, `test:audit`, `test:modules`, `test:contracts` — ✅ todos os 41 cenários, cobrindo praticamente toda superfície que usa `ConfirmDialog` — nenhuma regressão.
- **Verificação em navegador (Playwright)**:
  - Rota inexistente: renderiza a nova página 404 em pt-BR ("Não encontramos esta página"), sem erros de console após a correção do `OfflineBanner`.
  - Fluxo completo de desativação de paciente via `ConfirmDialog`: diálogo abre, campo de motivo obrigatório é respeitado (comportamento pré-existente, confirmado intacto), ao confirmar o botão mostra "Processando..." e fica desabilitado imediatamente (confirmado via `isEnabled() === false` logo após o clique), o diálogo permanece aberto durante o processamento e fecha sozinho ao concluir, toast de sucesso aparece — paciente reativado em seguida para deixar o banco de desenvolvimento limpo.
  - 0 erros de console em todas as passagens finais.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Médio-baixo: `ConfirmDialog` é um componente muito reutilizado; a mudança de comportamento (diálogo não fecha mais instantaneamente, permanece até a Server Action terminar) é visível ao usuário em todas as ~15 telas que o usam. Mitigado por: (a) os 8 test suites relacionados passando sem alteração, (b) verificação end-to-end real do fluxo mais comum (desativar/reativar), (c) a mudança é estritamente aditiva no tipo (`onConfirm` continua aceitando as mesmas funções, síncronas ou assíncronas, sem exigir alteração de assinatura em nenhum dos 15 arquivos consumidores).
- Baixo: demais mudanças (`global-error.tsx`, `error.tsx`, `not-found.tsx`, `OfflineBanner`) são aditivas ou isoladas a arquivos que só entram em uso em cenários de falha/rota inexistente/perda de conexão — não alteram nenhum fluxo de negócio.

## Próxima task sugerida

`UI-019-responsive-accessibility.md`.
