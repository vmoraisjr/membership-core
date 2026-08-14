# UI-060 — Empresa: Menu Enxuto e Início Operacional — Relatório de Implementação

## Entrega

- A navegação operacional da empresa foi reduzida a cinco entradas:
  **Visão geral**, **Planos**, **Clientes**, **Atendimentos** e
  **Cobranças**.
- Assinaturas, Benefícios e Módulos deixaram de aparecer como destinos
  paralelos. Suas rotas canônicas já apontam para o contexto que as conterá
  nas tasks seguintes.
- **Minha empresa** e **Suporte** formam uma área secundária no rodapé da
  sidebar. Por não pertencerem à seção operacional, continuam visíveis
  mesmo quando a assinatura SaaS bloqueia as rotinas da empresa.
- O Início foi simplificado para quatro indicadores de operação e dois
  atalhos contextualizados: Novo cliente (quando permitido) e Cobranças
  pendentes. A ação primária agora é Novo cliente, em vez de criar uma
  assinatura sem contexto de cliente.

## Segurança e permissões

- A visibilidade continua usando `hasPermission`; STAFF e FINANCE não ganham
  acesso por causa da reorganização.
- A exceção de acesso operacional foi limitada a Minha empresa e Suporte,
  resolvendo a rota de regularização sem expor rotinas bloqueadas.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.

## Próxima task

UI-061 — Hub Clientes e Fluxo de Cadastro.
