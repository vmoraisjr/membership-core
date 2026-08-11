# UI-044 - Bug: Catálogo Comercial Só Permite Editar um Item

## Objetivo da task

Investigar e corrigir por que, no Catálogo comercial, aparentemente só um
item pode ser editado (relatado pelo usuário durante o teste, sem
mais detalhes).

## Auditoria prévia

Não encontrei, por leitura de código, nenhuma guarda explícita limitando
edição a um único item em
`features/billing/components/platform-commercial-catalog-page.tsx` ou nos
componentes relacionados (`platform-plan-form.tsx`,
`platform-plan-side-panel.tsx` se existir). Precisa reprodução ativa —
não é possível diagnosticar só lendo o código.

## Escopo

- Reproduzir localmente: criar 2+ planos no catálogo comercial e tentar
  editar cada um.
- Se for bug de estado (ex. um `useState` de "item selecionado para
  edição" não resetando corretamente entre planos), corrigir a causa.
- Se for uma regra de negócio real (ex. só o plano "Sheep Growth" padrão é
  editável por algum motivo), documentar isso claramente na tela (texto
  explicando por que os outros estão bloqueados) em vez de deixar o
  usuário sem explicação.

## Critérios de aceite

- Comportamento correto confirmado: todo plano pode ser editado, ou há
  uma explicação visível na tela do motivo de algum estar bloqueado.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.
- `pnpm test:billing` sem regressão.
