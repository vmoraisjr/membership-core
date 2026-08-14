# UI-062 — Workspace do Cliente: Relacionamento Completo — Relatório de Implementação

## Entrega

- O workspace do cliente (`/dashboard/clientes/[clienteId]`) agora usa as
  abas canônicas com valores internos alinhados a `CustomerTab`
  (`overview`, `membership`, `benefits`, `billing`, `history`) — a
  indireção de mapeamento criada na UI-061 foi removida, já que os nomes
  batem 1:1 com a URL.
- **Resumo** ganhou um bloco "Situação atual" no topo: plano/assinatura
  vigente com badge de status, situação financeira (em dia / pendente /
  atraso) e contagem de benefícios disponíveis, cada um com um atalho para
  a aba correspondente. Quando o titular ainda não tem assinatura, o
  atalho é "Nova assinatura" — a mesma ação sem precisar sair da tela.
  Abaixo, os dados de identificação e o histórico de contratos
  continuam como antes, agora com um botão "Editar" que abre o mesmo
  diálogo de edição usado na lista (UI-061), sem precisar voltar para
  Clientes.
- **Assinatura**: a tabela deixou de ser somente leitura com um link
  "Abrir" para a lista global. Agora reutiliza `SubscriptionRowActions` e
  `SubscriptionStatusBadge` (os mesmos componentes da tela global de
  Assinaturas) para editar, pausar, retomar, renovar, expirar e cancelar
  diretamente por linha, e oferece "Nova assinatura" quando o titular
  ainda não tem uma. Dependentes veem a assinatura herdada, sem ações
  diretas — explicitamente indicando que a gestão é pelo titular.
- **Benefícios**: ação "Usar benefício" (mesmo `ConsumeBenefitDialog` já
  usado na lista de clientes) some no topo quando há saldo aplicável, e o
  histórico de uso permanece abaixo.
- **Cobranças**: a tabela somente leitura foi substituída pela mesma
  `PatientPaymentsTable`/`PatientInvoiceActions` que alimentará a fila
  global da UI-064 — marcar como pago, marcar em atraso, cancelar fatura e
  atualizar forma de pagamento já funcionam a partir do cadastro do
  cliente, com filtros de status/método/plano/período.
- **Histórico**: sem mudanças de conteúdo.
- Os atalhos de "Situação atual" e os links da lista de clientes que
  apontam para uma aba específica (`?tab=...`) agora trocam de aba de
  forma confiável: como o `Tabs` da Radix só respeita `defaultValue` na
  montagem, o componente ganhou `key={activeTab}`, forçando uma remontagem
  controlada quando a navegação troca a aba pretendida — sem perder o
  comportamento client-side instantâneo ao clicar nas abas já montadas.

## Reuso e domínio

- Nenhuma Server Action nova. Todas as mutações (assinatura, benefício,
  cobrança, cadastro) já existiam e continuam com a mesma validação de
  RBAC/tenant; o workspace só passou a expor os componentes que já as
  usavam (`SubscriptionDialog`, `SubscriptionRowActions`,
  `ConsumeBenefitDialog`, `PatientPaymentsTable`, `PatientDialog`).
- Uma pequena consulta local (`prisma.patient.findMany` por titulares
  ativos da clínica) foi adicionada só para alimentar a lista de
  responsáveis do diálogo de edição quando o cliente é dependente —
  necessária apenas para a pré-visualização "Responsável localizado", sem
  nenhuma escrita nova.
- Cobranças/assinaturas de dependentes seguem resolvidas via
  `subscriptionSourcePatient` (já existente em `getPatientProfile`), sem
  duplicar dados: dependente sempre lê e é cobrado a partir do registro do
  titular.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.
- `pnpm test:membership` — 4 cenários passaram.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:rbac` — 5 cenários passaram.
- `pnpm test:billing` — 14 cenários passaram.
- Playwright (build de produção, roteiro descartável após validação):
  cliente sem assinatura mostra "Nova assinatura" no Resumo; criar a
  assinatura a partir dali; pausar e retomar diretamente na aba Assinatura
  refletindo o badge de status; atalho "Ver cobranças" do Resumo troca
  para a aba Cobranças corretamente (URL com `tab=billing` e aba marcada
  como ativa); ações de cobrança (`Marcar como pago`) aparecem na aba;
  botão "Editar" do Resumo abre o diálogo de edição do cliente.

## Próxima task

UI-063 — Hub Planos: Oferta Local e Benefícios.
