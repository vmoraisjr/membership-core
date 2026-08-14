# UI-059 — Empresa: Arquitetura de Informação, Rotas Canônicas e Matriz por Papel — Relatório de Implementação

## Entrega

Foi criada a fundação de navegação da Fase 6 sem alterar o domínio
`Patient`/`MembershipPlan`/`Clinic`, sem migração e sem mudar regras de
negócio.

## Rotas canônicas disponíveis

- `/dashboard/clientes` e `/dashboard/clientes/[clienteId]`
- `/dashboard/planos` e `/dashboard/planos/[planoId]`
- `/dashboard/cobrancas`
- `/dashboard/atendimentos`
- `/dashboard/minha-empresa?tab=profile|subscription|team|resources|support`

Os componentes atuais foram reutilizados como adaptadores. As consolidações
visuais e de conteúdo ficam intencionalmente para UI-061 a UI-066.

## Compatibilidade e contexto

- Criado `lib/company-routes.ts` com builders tipados para todas as rotas
  canônicas de empresa, compartilhando o helper genérico `lib/route-query.ts`.
- A camada owner passou a usar o mesmo helper, mantendo a construção de URLs
  centralizada em vez de duplicar serialização de query string.
- Rotas antigas de empresa agora redirecionam para o destino canônico:
  `patients`, `plans`, `subscriptions`, `benefits`, `benefit-usage`,
  `payments`, `company`, `messages`, `users` e `modules`.
- Quando há contexto conhecido, ele é preservado: assinatura de um paciente
  abre o cliente na aba de assinatura; benefícios de um plano abrem o plano
  no contexto de benefícios; mensagens, equipe e recursos abrem Minha
  empresa na aba adequada.
- Breadcrumbs reconhecem os novos nomes Clientes, Planos, Cobranças,
  Atendimentos e Minha empresa.

## Acesso quando o SaaS bloqueia a operação

`/dashboard/minha-empresa` usa apenas a guarda de empresa vinculada, não a
guarda de acesso operacional. Portanto Perfil, Assinatura Sheep, Equipe,
Recursos e Suporte seguem alcançáveis por URL mesmo em atraso, pausa ou
suspensão. A simplificação visível da sidebar será aplicada na UI-060.

## Preservação de segurança

- As páginas operacionais canônicas reutilizam
  `renderOperationalClinicScopedPage`.
- Minha empresa reutiliza `renderClinicScopedPage`.
- Nenhuma action, query de tenant, schema Prisma ou regra de RBAC foi
  modificada; as rotas apenas encaminham para os componentes já guardados no
  servidor.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou; todas as rotas canônicas foram
  registradas no build.
- `pnpm test:rbac` — 5 cenários passaram.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:billing` — 14 cenários passaram.

## Próxima task

UI-060 — Empresa: Menu Enxuto e Início Operacional.
