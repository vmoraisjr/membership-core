# UI-065 — Atendimentos: Validar Benefício e Consultar Uso — Relatório de Implementação

## Entrega

- `/dashboard/atendimentos` já era a rota canônica (UI-059) reutilizando
  `BenefitUsageHistoryPage`. O nome da tela e da entrada de menu, que
  ainda diziam "Uso de benefício", passaram a se chamar **Atendimentos**
  em todos os pontos (título da página, item da sidebar, mensagens de
  acesso negado), e a ação principal do cabeçalho — antes "Consumir
  benefício" — agora é **"Validar benefício"**, consistente com a
  linguagem pedida pela task.
- O fluxo de validação (`ConsumeBenefitDialog`, sem mudanças de
  comportamento) já cobria o pedido: seleção do cliente/assinatura
  primeiro, benefícios elegíveis filtrados automaticamente por essa
  seleção, saldo restante e regra de renovação exibidos antes de
  confirmar.
- Cada registro do histórico agora leva ao cliente: o nome na linha virou
  link para `clienteUrl(id, { tab: "benefits", returnTo })`, abrindo a
  mesma aba Benefícios construída na UI-062. Do cliente, o botão de
  voltar passou a reconhecer a origem — "Voltar para atendimentos" quando
  `returnTo` aponta para `/dashboard/atendimentos` (e "Voltar para
  cobranças" quando aponta para `/dashboard/cobrancas`, cobrindo também a
  UI-064) — em vez do rótulo fixo "Voltar para clientes" para qualquer
  origem.
- Os filtros de status/período/busca do histórico passaram a ficar na URL
  (mesmo debounce e a mesma proteção contra disparo no primeiro
  carregamento adotada nas UI-061/UI-064), então voltar do cliente
  restaura a mesma busca/filtro do atendimento.
- Histórico, filtros e cancelamento continuam como recurso secundário —
  abaixo da ação primária, sem competir por atenção — e o cancelamento
  segue restrito a OWNER/ADMIN, sem mudança de regra.
- STAFF já enxerga apenas Clientes e Atendimentos na navegação
  operacional (a matriz de permissões nega `plans`, `billing` e `clinic`
  para esse papel desde antes desta task); confirmado, sem necessidade de
  ajuste.

## Fora do escopo (confirmado intocado)

- Nenhuma mudança em limite, periodicidade ou regra de consumo de
  benefício.
- Nenhum recurso de QR code, agendamento, CRM ou comunicação
  omnichannel foi adicionado.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.
- `pnpm test:membership` — 4 cenários passaram.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:rbac` — 5 cenários passaram.
- Playwright (build de produção, roteiro descartável após validação):
  `/dashboard/benefit-usage` redireciona para `/dashboard/atendimentos`
  com o novo título; validar benefício de ponta a ponta (cliente → saldo
  exibido → confirmação); linha do histórico com link para o cliente
  (aba Benefícios, `returnTo` presente); "Voltar para atendimentos"
  restaura a busca aplicada; cancelar uso reflete "Cancelado em" na
  mesma linha.

## Próxima task

UI-066 — Minha Empresa: Conta, Equipe, Recursos e Suporte.
