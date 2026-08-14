# Sheep Frontend Transformation

## Fase 1 — Fundação (concluída, em `tasks/review`)

UI-000 → UI-001 → UI-002 → UI-003 → UI-004 → UI-005 → UI-006 → UI-007 → UI-008 → UI-009 → UI-010 → UI-011 → UI-012 → UI-013 → UI-014 → UI-015 → UI-016 → UI-017 → UI-018 → UI-019 → UI-020

## Fase 2 — Rebrand (identidade esmeralda/ciano) (concluída, em `tasks/review`)

Auditoria em `docs/frontend-rebrand-audit.md`.

UI-021 (bordas/superfícies) → UI-022 (pacientes) → UI-023 (planos) →
UI-024 (benefícios/uso) → UI-025 (assinaturas) → UI-026 (pagamentos) →
UI-027 (usuários) → UI-028 (auditoria/módulos) → UI-029 (controles nativos
restantes — nenhum gap real encontrado) → UI-030 (escala tipográfica) →
UI-031 (varredura final)

## Fase 3 — QA/UX Agosto 2026 (backlog, ainda não iniciada)

Origem: `qa-ux review.pdf` anexado pelo usuário. Entendimento em
`docs/qa-ux-review-2026-08.md`.

UI-032 (login/loading) → UI-033 (breadcrumb) → UI-034 (hero dashboard +
menu de usuário) → UI-035 (panorama/remoção de seções) → UI-036
(reconfirmar botão de colapsar) → UI-037 (tooltips) → UI-038 (visão
rápida) → UI-039 (workspace da empresa — **parte B precisa aprovação de
escopo**) → UI-040 (densidade global, 2ª rodada) → UI-041 (auditoria de
confirmação em ações destrutivas) → UI-042 (fluxo de troca de plano) →
UI-043 (bug: status atrasado automático) → UI-044 (bug: catálogo só edita
um item) → UI-045 (bug: erro de hidratação em Módulos) → UI-046
(reestruturação de Chamados — **precisa aprovação de escopo**)

## Fluxo

`backlog → in-progress → review → done`

## Regras

- Uma task por vez.
- Não iniciar a próxima automaticamente.
- Aprovação humana antes de `done`.
- Não alterar backend ou regra de negócio para acomodar decisões visuais
  (exceção: UI-039/UI-041/UI-042/UI-043/UI-044/UI-045 têm componente
  funcional explícito, não são puramente visuais).
- Não ativar/alterar CRM (`features/crm`) nem `features/contracts`
  (dormente, fora do V1). `features/messages` (Chamados) **não** está
  nessa lista — é o sistema de tickets operacionais plataforma↔clínica,
  já confirmado em uso real, distinto do "Communication hub" (WhatsApp/
  Instagram/Inbox) que o CLAUDE.md bloqueia.
- Todo texto novo deve usar i18n pt-BR.

## Fase 4 — Plataforma Owner: navegação por contexto e densidade objetiva (backlog)

Origem: estudo de rotas, links, cliques e ações da visão Plataforma em
11/08/2026, aprovado pelo usuário.

Princípio de produto: **Planos comerciais define a oferta; Empresas
administra a contratação e a operação de uma conta.** Nenhuma ação de uma
empresa deve exigir que o owner encontre outra seção global antes de poder
concluí-la.

UI-049 (contrato de informação, rotas canônicas e transição segura) →
UI-050 (fundação de densidade visual objetiva) → UI-051 (sidebar e início
orientados por contexto) → UI-052 (hub Planos comerciais) → UI-053
(workspace Empresa: resumo e plano/cobrança) → UI-054 (workspace Empresa:
pessoas e módulos) → UI-055 (Chamados contextualizados por empresa) →
UI-056 (Administração: equipe Sheep e auditoria) → UI-057 (retirada das
entradas legadas e regressão de links) → UI-058 (QA final de navegação,
densidade e acessibilidade).

### Regra adicional desta fase

- Executar estritamente uma task por vez, na ordem acima; cada task deve
  migrar para `tasks/review` e aguardar aprovação humana antes da próxima.
- Manter `Clinic`/`clinicId` no domínio, Prisma e serviços. “Empresa” é o
  termo de produto da plataforma e não autoriza migração de banco nem
  alteração da isolação multi-tenant.
- Rotas antigas devem continuar funcionando por redirecionamento até a
  UI-057. Links internos novos devem usar somente as rotas canônicas
  definidas na UI-049.

## Fase 5 — Cobrança recorrente da plataforma por cartão (backlog)

Objetivo: transformar a cobrança SaaS plataforma↔empresa, hoje acompanhada
manualmente pelo owner, em uma assinatura mensal recorrente por cartão. O
primeiro mês é gratuito; cada cobrança aprovada libera o mês seguinte. A
empresa deve conseguir concluir, acompanhar, pausar ou cancelar a própria
assinatura sem depender do suporte.

`PAY-001` (decisão do provedor e fundação do domínio) → `PAY-002` (jornada
da empresa: teste, checkout e gestão) → `PAY-003` (webhooks, renovação e
controle de acesso) → `PAY-004` (visão owner, conciliação e operação).

### Regras adicionais desta fase

- Escopo exclusivo da cobrança **Sheep ↔ empresa**. Não alterar pagamentos
  ou assinaturas de pacientes.
- Nunca receber, persistir ou registrar número/CVV de cartão na Sheep: usar
  checkout e portal hospedados/tokenizados pelo provedor escolhido.
- Uma empresa tem no máximo uma assinatura SaaS recorrente ativa ou em
  teste; eventos do provedor precisam ser idempotentes e auditáveis.
- "Pausar" interrompe a próxima renovação e preserva os dados; reativar
  exige uma cobrança aprovada antes de restaurar o acesso. "Cancelar"
  encerra a renovação ao fim do período já pago, salvo cancelamento imediato
  explicitamente confirmado pelo cliente.
- O trial comercial padrão desta fase é de 30 dias (primeiro mês grátis),
  apresentado com data de término inequívoca. Planos legados com outro
  `trialDays` devem ser migrados ou tratados explicitamente na PAY-001.
- Executar uma task por vez e mover a task concluída para `tasks/review`;
  aguardar aprovação humana antes da próxima.

## Fase 6 — Workspace da empresa: operação simples e contextual (backlog)

Origem: estudo de navegação, rotas, links e ações da visão Empresa em
12/08/2026, solicitado pelo usuário.

Princípio de produto: **o cadastro do cliente é o contexto de sua relação
com a empresa; o plano é o contexto de sua oferta; a empresa é o contexto
da sua própria conta Sheep.** O usuário não deve descobrir uma segunda tela
global apenas para concluir uma ação que começou em um desses contextos.

UI-059 (contrato de navegação, rotas e matriz por papel) → UI-060 (menu e
início operacional) → UI-061 (hub Clientes e fluxo de cadastro) → UI-062
(workspace do cliente: relacionamento completo) → UI-063 (hub Planos e
benefícios) → UI-064 (Cobranças: fila financeira e contexto do cliente) →
UI-065 (Atendimentos: validar benefício e histórico) → UI-066 (Minha
empresa: conta, equipe, recursos e suporte) → UI-067 (remoção de caminhos
legados e regressão de permissões) → UI-068 (QA final de simplicidade,
acessibilidade e jornadas por papel).

### Regras adicionais desta fase

- Executar estritamente uma task por vez, na ordem acima, e mover cada uma
  para `tasks/review`; aguardar aprovação humana antes de iniciar a próxima.
- Preservar o domínio interno `Patient`, `MembershipPlan`, `Subscription`,
  `MembershipBenefit` e a isolação por `clinicId`. “Cliente”, “Plano” e
  “Minha empresa” são decisões de linguagem e contexto, não autorização
  para migração de banco.
- Acesso a **Minha empresa**, **Assinatura Sheep** e **Suporte/Chamados**
  deve permanecer disponível mesmo com plano SaaS pausado, suspenso ou em
  atraso. Não esconder a única rota de regularização ou pedido de ajuda.
- A Fase 6 depende da conclusão da Fase 4 para reutilizar rotas e padrões
  canônicos de plataforma. A parte de assinatura Sheep na UI-066 deve
  preservar e integrar, sem reimplementar, a jornada PAY-002/PAY-003.
- Todo texto novo deve usar i18n pt-BR; não ativar CRM, contratos, agenda
  ou comunicação omnichannel fora do sistema de Chamados existente.
