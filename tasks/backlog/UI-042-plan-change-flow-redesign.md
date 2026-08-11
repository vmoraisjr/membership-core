# UI-042 - Fluxo de Troca de Plano e Rótulo "Enviar para Trial"

## Objetivo da task

Redesenhar como o plano SaaS aplicado a uma empresa é trocado (hoje um
`<Select>` inline que já dispara a mudança ao selecionar, sem
confirmação) e esclarecer o rótulo "Enviar para trial".

## Auditoria prévia (já feita)

Ver `docs/qa-ux-review-2026-08.md`, "Bugs encontrados" itens 4 e 6.
Fluxo atual em
`features/billing/components/platform-saas-subscriptions-page.tsx`
(linhas ~530-576 antes das últimas edições): `<Select
name="clinicBillingPlanId" defaultValue={...}>` dentro de um `<form
action={platformAssignClinicBillingPlanAction}>`, com um botão "Trocar
plano" que envia o formulário — o `Select` já mostra a lista completa de
planos como se fosse um filtro, o que o QA descreve como confuso.

## Escopo

- Trocar a célula "Plano aplicado" para mostrar o nome do plano atual
  como **texto simples**, sem `Select`.
- Adicionar uma ação "Trocar plano" (botão/ícone) que abre um formulário
  pequeno (mesmo padrão visual do "ver detalhe"/quick view da UI-038) com
  a lista de planos disponíveis.
- Esse mini formulário deve exigir confirmação (`ConfirmDialog` ou
  confirmação embutida) antes de aplicar a troca — não deve haver como
  trocar o plano de uma empresa com um único clique acidental.
- Revisar a copy da ação `billing.actions.sendToTrial` ("Enviar para
  trial") para deixar claro o efeito (ex. "Colocar em teste — suspende a
  cobrança recorrente até a conta ser reativada", ajustar conforme o
  comportamento real do sistema).

## Critérios de aceite

- Troca de plano exige uma ação explícita + confirmação, não é mais
  possível trocar sem querer ao interagir com a listagem.
- Rótulo da ação de trial deixa claro o que acontece.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.
- `pnpm test:billing` sem regressão.
