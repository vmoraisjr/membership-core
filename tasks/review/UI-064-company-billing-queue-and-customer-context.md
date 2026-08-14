# UI-064 — Cobranças: Fila Financeira e Contexto do Cliente — Relatório de Implementação

## Entrega

- `/dashboard/cobrancas` já era a rota canônica desde a UI-059 e já
  estava reduzida a indicadores de decisão (a receber, recebido no mês,
  em atraso, taxa de inadimplência) + tabela de faturas
  (`PatientPaymentsPage`/`PatientPaymentsTable`); nenhuma métrica ou
  filtro redundante foi encontrado para remover. Os cinco filtros pedidos
  pela task — situação, vencimento, método, plano e busca por cliente —
  já existiam integralmente na tabela.
- O que faltava era o vínculo com o cliente: `PatientPaymentsTable` (o
  mesmo componente já reutilizado no workspace do cliente pela UI-062)
  ganhou duas props opt-in, **desligadas por padrão** para não alterar o
  uso existente na aba Cobranças do cliente:
  - `linkToPatient`: transforma o nome do cliente na linha em link para
    `clienteUrl(id, { tab: "billing", returnTo })`, abrindo a mesma aba
    de Cobranças construída na UI-062 — mesmo estado, mesmo componente,
    sem cópia de regra.
  - `syncFiltersToUrl`: mantém situação/vencimento/método/plano/busca na
    URL (com o mesmo debounce e a mesma proteção contra disparo no
    primeiro carregamento usada na UI-061, para não interferir em
    diálogos abertos), permitindo que `returnTo` reconstrua exatamente a
    fila filtrada ao voltar do cliente.
  - Ambas só são ativadas em `PatientPaymentsPage` (a fila global); a
    instância embutida no workspace do cliente (UI-062) continua com o
    comportamento simples de antes.
- `getBillingOverview` passou a selecionar `patient.id` (além de
  `fullName`) — único ajuste na consulta, necessário para montar o link.
- Baixar, alterar método, marcar atraso e cancelar continuam exatamente
  como já eram (`PatientInvoiceActions`, sem duplicação), tanto na fila
  quanto na aba do cliente.
- Cobrança Sheep ↔ empresa (`ClinicInvoice`, `/dashboard/billing/payments`,
  fluxo PAY) não foi tocada — é um domínio e uma rota totalmente
  separados dos `PatientInvoice` tratados aqui.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.
- `pnpm test:billing` — 14 cenários passaram.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:rbac` — 5 cenários passaram.
- Playwright (build de produção, roteiro descartável após validação):
  `/dashboard/payments` redireciona para `/dashboard/cobrancas`; busca
  filtrada por cliente preservada na URL; clicar no nome do cliente na
  fila abre a aba Cobranças do workspace (URL com `tab=billing` e
  `returnTo`); "Voltar para clientes" retorna à fila com o mesmo filtro
  de busca aplicado; "Marcar como pago" funciona diretamente na linha da
  fila e reflete o novo status na mesma tabela.

## Próxima task

UI-065 — Atendimentos: Validar Benefício e Consultar Uso.
