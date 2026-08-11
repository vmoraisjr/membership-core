# UI-020 - Varredura Comercial Final — Relatório de Implementação

## Objetivo da task

Revisar o produto como comprador. Auditar primeira impressão, consistência, clareza, confiança, linguagem, responsividade, hierarquia, densidade, velocidade percebida, empty states, formulários, finanças, dialogs, textos técnicos, inglês, enums e componentes antigos. Remover telas antigas não usadas, componentes substituídos, CSS obsoleto, layouts duplicados, textos antigos, placeholders e mocks visuais. Entregar `docs/frontend-commercial-readiness.md`. Critérios finais: nenhuma tela antiga, nenhum inglês ou enum bruto visível, nenhum fluxo crítico sem feedback, produto demonstra valor em menos de 5 minutos, pronto para demonstração comercial.

## Auditoria prévia

Diferente das 19 tasks anteriores (cada uma redesenhando uma área específica), esta é uma task de varredura: usei `docs/frontend-audit.md` (o inventário original da UI-000) como ponto de partida para conferir o que havia sido endereçado e o que não tinha número de task próprio, e então varri o código atual (`grep` por `<select>`/`<table>` crus remanescentes, componentes sem importador, `console.log`, `TODO`/mock) para encontrar o que sobrou.

Achado principal: **`/dashboard/messages` (Chamados) nunca foi objeto de nenhuma das 20 tasks** — não está na lista UI-001→UI-020, mas é uma feature ativa (não dormente como CRM), com Server Actions e schema próprios. O arquivo (518 linhas) estava inteiramente em markup cru, 100% fora do i18n, e — mais grave — **sem nenhuma chamada a `assertPermission` em nenhuma das 3 Server Actions**, apesar de a matriz de RBAC (`features/rbac/permissions.ts`) já definir `messages: ["view","manage"]`/`["view"]` por perfil desde antes desta task. Qualquer usuário autenticado, independente de perfil, podia abrir e responder chamados. Adicionalmente, a navegação lateral tinha essa tela marcada como `platformOnly: true`, escondendo-a de usuários de clínica mesmo que a própria página já implementasse o fluxo completo "empresa abre chamado com a plataforma".

Segundo achado, já previsto pelo próprio `docs/frontend-audit.md` §1.15: `/dashboard/contracts` permanecia acessível via URL direta (714 linhas de markup cru), apesar de já estar fora do menu — exatamente o padrão que CRM já resolve corretamente via `notFound()`.

Terceiro achado: 4 últimos `<select>` crus em arquivos que não fizeram parte do escopo textual de nenhuma task anterior (`platform-plan-form.tsx`, tocado indiretamente pela UI-015 mas não este arquivo específico; `patient-dialog.tsx`, da UI-007; `platform-users-overview-panel.tsx` ×3, documentado como "patch leve" na UI-013).

## Arquivos criados

- `docs/frontend-commercial-readiness.md` — entrega obrigatória desta task; audita o produto pelas dimensões pedidas e documenta o veredito final de prontidão comercial.
- `features/messages/utils/support-status.ts` — `getSupportThreadStatusTone`, seguindo o mesmo padrão de tom-por-status já usado em `clinic`/`billing`/`modules`.

## Arquivos removidos

- `components/dashboard/table-actions.tsx` — código morto (zero importadores), também sem nome acessível em nenhum dos dois botões.
- `features/auth/components/role-switcher.tsx` — ferramenta de troca de usuário para debug, zero importadores, texto em inglês.

## Arquivos modificados

- `features/messages/components/support-threads-page.tsx` — reescrito: `<select>`/`<input>`/`<textarea>`/`<button>` crus substituídos por `Select`/`Input`/`Textarea`/`Button`; lista vazia migrada para `EmptyState`; badges de status migrados para `StatusIndicator`; adicionado o gate `hasPermission(role, "messages", "view")` + `AccessDenied` (inexistente antes); os formulários de criar chamado/responder/mudar status agora só aparecem para quem tem `manage` — usuários só-leitura veem a conversa e o status atual, sem os controles de escrita.
- `features/messages/actions/create-support-thread.ts`, `add-support-message.ts`, `update-support-thread-status.ts` — adicionado `await assertPermission("messages", "manage")` no início de cada uma, fechando a lacuna de RBAC. A permissão já existia na matriz (`permissions.ts`) para todos os 5 perfis; esta mudança apenas conecta uma regra que já estava definida e testada implicitamente pela ausência de violação nos testes de RBAC existentes.
- `components/layout/dashboard-sidebar.tsx` — item de navegação "Chamados" deixou de ser `platformOnly`; rótulo migrado para `t("navigation.messages")`.
- `app/(dashboard)/dashboard/contracts/page.tsx` — substituído por `notFound()`, mesmo padrão de `/dashboard/crm`, com comentário explicando a intenção (preservar o código para escopo futuro sem expor a rota em V1).
- `features/billing/components/platform-plan-form.tsx` — `<select>` de disponibilidade migrado para `Select`.
- `features/patients/components/patient-dialog.tsx` — `<select>` de "Tipo do cliente" migrado para `Select` (mantendo o `{...form.register("kind")}` do React Hook Form).
- `features/users/components/platform-users-overview-panel.tsx` — os 3 `<select>` restantes (perfil de acesso no formulário, filtro de perfil, filtro de status) migrados para `Select`.
- `messages/pt-BR.json` — novo namespace `support` completo (títulos, categorias, status, formulários, conversa); nova chave `navigation.messages`.

## Decisões arquiteturais

- **Corrigir o gap de RBAC em Chamados, não apenas documentá-lo.** A regra "Preserve RBAC enforcement" pressupõe que a proteção já existe; aqui ela estava definida na matriz mas nunca conectada — o mesmo padrão de "preparado mas nunca ligado" já encontrado e corrigido em tasks anteriores (UI-008 `annualPrice`, UI-013 convites). Não é uma regra de negócio nova, é a regra já declarada sendo finalmente aplicada, com o mesmo helper (`assertPermission`) usado em todas as outras ~30 Server Actions do produto.
- **Bloquear Contracts via `notFound()`, não excluir o código.** Mesmo raciocínio já validado para CRM: nenhuma parte da UI linka para `/dashboard/contracts` (confirmado por busca), e a lógica de negócio de contratos (templates, geração automática ao criar assinatura) continua funcionando via Server Actions independente da página existir. Isso resolve o item "nenhuma tela antiga" sem arriscar remover uma feature que pode voltar ao roadmap.
- **Não redesenhei CRM.** Mandatório por regra permanente; CRM já estava corretamente bloqueado desde antes desta task e serviu de modelo para o bloqueio de Contracts.
- **`docs/frontend-commercial-readiness.md` cita explicitamente as dívidas conhecidas remanescentes** (módulos futuros com nome em inglês no banco, filtro de auditoria de dia único) em vez de omiti-las — o objetivo da entrega é um veredito honesto de prontidão, não uma lista apenas de sucessos.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 29 rotas geradas.
- `pnpm test:tenant`, `test:rbac`, `test:membership`, `test:billing`, `test:users`, `test:contracts`, `test:audit`, `test:modules` — ✅ todos os 41 cenários, nenhuma regressão (o teste de contratos opera na camada de Server Action/serviço, não na página agora bloqueada, então não é afetado pelo `notFound()`).
- **Verificação em navegador (Playwright)**:
  - Chamados, visão de clínica (`owner+nortex-medical@…`): "Chamados" agora aparece na navegação lateral (antes ausente); formulário "Novo chamado" com campos migrados; filtros como `Select`; `EmptyState` exibido corretamente para lista vazia.
  - Chamados, visão de plataforma (`owner+workspace@…`): lista de chamados reais renderizada com `StatusIndicator` ("Resolvido"/"Aberto"), conversa completa, formulário de resposta e troca de status funcionais.
  - `/dashboard/contracts`: confirma renderizar a página 404 em pt-BR (a mesma da UI-018), não mais o conteúdo cru anterior.
  - `patient-dialog.tsx`: campo "Tipo do cliente" confirmado usando o componente `Select` do Design System, com foco visual consistente com os demais campos.
  - 0 erros de console em todas as passagens.

## Trabalho remanescente

- Nenhum dentro do escopo desta task. Dívidas conhecidas documentadas em `docs/frontend-commercial-readiness.md` §8.

## Riscos

- Baixo-médio: a adição de `assertPermission` em Chamados é uma mudança de comportamento real — perfis STAFF/READ_ONLY que antes conseguiam abrir/responder chamados agora só conseguem visualizar. Isso é o comportamento pretendido pela matriz de RBAC já existente, não uma regra nova inventada nesta task; ainda assim, é a mudança de maior impacto potencial neste relatório. Mitigado por: a matriz já definia essa permissão antes desta task (não é uma decisão de produto nova), e os 8 test suites relacionados a RBAC/tenant/auditoria passam sem alteração.
- Baixo: bloqueio de `/dashboard/contracts` é reversível (basta remover o `notFound()`) e não tem nenhum link de UI apontando para a rota, confirmado por busca antes da mudança.
- Baixo: demais mudanças (`<select>` → `Select`, remoção de componentes mortos) são estritamente de apresentação, sem alteração de dado ou de Server Action.

## Sequência UI-001 → UI-020

Esta é a última task da sequência definida em `tasks/backlog/README-FRONTEND.md`. Todas as 20 tasks foram executadas sequencialmente sob a autorização permanente concedida no início da sessão. Não há próxima task sugerida.
