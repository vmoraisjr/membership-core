# UI-029 - Controles Nativos Restantes → Componentes do Design System — Relatório de Implementação

## Objetivo da task

Terminar a migração de `<select>`/`<input>` HTML crus para `Select`/`Input`
do design system nos arquivos listados em `docs/frontend-rebrand-audit.md`,
seção 10.

## Auditoria — resultado: nenhum gap real encontrado

Conferi cada uma das ocorrências listadas no audit com grep + leitura de
contexto antes de alterar qualquer coisa. Todas, sem exceção, são
`<input type="hidden">` usados para carregar um id (`userId`, `invoiceId`,
`moduleKey`, `planId`, `inviteId`) dentro de um `<form action={...}>` — não
são controles visíveis, não herdam estilo do navegador, não têm nada a ver
com o problema visual que a task original mirava:

- `features/users/components/users-overview-panel.tsx` (5 ocorrências) — todas hidden.
- `features/users/components/platform-users-overview-panel.tsx` (1) — hidden.
- `features/billing/components/platform-saas-payments-page.tsx` (2) — hidden.
- `features/membership-benefits/components/membership-benefit-dialog.tsx` (1) — hidden.
- `features/billing/components/platform-plan-form.tsx` (1, listado por engano no
  audit original como `features/membership-plans/.../platform-plan-form.tsx`
  — arquivo não existe nesse caminho; o real fica em `features/billing/`) — hidden.
- `features/auth/components/login-form.tsx` (1) — hidden (campo `next` do
  redirect pós-login, não autofill de senha como eu tinha suposto no audit
  original, mas também não é um gap visual).
- `features/modules/components/modules-page.tsx` (2, já verificado na
  UI-028) — hidden.

Varredura adicional (não limitada às linhas do audit original): busquei
`<select` e `<input` em todo `apps/web/features` para garantir que nenhum
controle visível ficou de fora da lista original. Os únicos `<select>`
nativos do projeto inteiro estão em `features/contracts` e `features/crm`
— fora de escopo por regra do CLAUDE.md. Nenhum `<input>` visível
(não-hidden) foi encontrado em nenhum arquivo dentro do escopo permitido.

**Conclusão: o achado original da varredura automatizada (`docs/frontend-rebrand-audit.md`,
seção 10) contava inputs `hidden` como se fossem controles visíveis — o
número "32 ocorrências em 11 arquivos" não representa um gap real.** A
migração de controles nativos para `Select`/`Input` já estava, de fato,
100% completa antes desta task.

## Arquivos modificados

Nenhum — não havia o que migrar.

## Validação executada

Não aplicável (nenhuma mudança de código). Typecheck/lint/build permanecem
no estado validado pela UI-028.

## Riscos

Nenhum.

## Próxima task sugerida

`UI-030-typography-scale.md`.
