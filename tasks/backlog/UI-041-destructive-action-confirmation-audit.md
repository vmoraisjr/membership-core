# UI-041 - Auditoria de Confirmação em Ações Destrutivas

## Objetivo da task

Garantir que toda ação destrutiva/irreversível (cancelar, desativar,
excluir, mudar status crítico) peça confirmação antes de executar, em
todas as telas — hoje inconsistente.

## Auditoria prévia (já feita)

Ver `docs/qa-ux-review-2026-08.md`, "Bugs encontrados" item 3. Achado
concreto: em `features/billing/components/platform-saas-subscriptions-page.tsx`,
as transições de status de assinatura SaaS
(`platformUpdateClinicSubscriptionStatusAction`, inclui **cancelar**) são
`<form><Button type="submit">` direto — **sem** `ConfirmDialog`. Isso
contrasta com `features/subscriptions/components/subscription-row-actions.tsx`
e `features/clinic/components/clinic-row-actions.tsx`, que já envolvem
ações equivalentes em `ConfirmDialog`. É a causa mais provável do
cancelamento relatado como acidental pelo usuário durante o teste.

## Escopo

- Envolver os botões de transição de status em
  `platform-saas-subscriptions-page.tsx` (`ClinicSubscriptionStatus.CANCELED`
  no mínimo; avaliar se `SUSPENDED` também merece confirmação) em
  `ConfirmDialog`, mesmo padrão usado em `subscription-row-actions.tsx`.
- Varredura em outras telas por `<form action={...}><Button type="submit">`
  sem `ConfirmDialog` em torno de ações que mudam/removem dado (não
  apenas criam).
- Padronizar título/descrição do `ConfirmDialog` para ações de
  cancelamento em todo o app (hoje o texto varia por tela).

## Critérios de aceite

- Nenhuma ação destrutiva executa sem confirmação explícita do usuário.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.
- `pnpm test:billing` sem regressão.

## Restrições

- Não adicionar confirmação em ações não-destrutivas (ex. filtrar,
  buscar) — só onde há perda de dado ou mudança de estado difícil de
  reverter.
