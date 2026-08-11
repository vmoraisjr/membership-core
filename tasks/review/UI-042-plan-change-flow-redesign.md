# UI-042 - Fluxo de Troca de Plano e Rótulo "Enviar para Trial" — Relatório de Implementação

## Objetivo da task

Redesenhar a troca de plano SaaS de uma empresa (hoje um `<Select>`
sempre visível na linha, já pré-selecionado, que dispara a troca ao
enviar o formulário) e esclarecer o rótulo "Enviar para trial".

## Arquivos modificados

- `features/billing/components/platform-plan-change-dialog.tsx` (novo)
  — mini formulário em `Dialog` (`components/ui/dialog.tsx`), mesmo
  padrão de "ver detalhe": mostra o plano atual como texto, um `Select`
  para o novo plano, um aviso amarelo explicando o efeito real da troca
  (a assinatura volta para "Pendente" até a próxima cobrança) **só
  quando o plano selecionado é diferente do atual**, e um botão "Aplicar
  troca de plano" desabilitado até haver mudança real.
- `features/billing/components/platform-saas-subscriptions-page.tsx` —
  célula "Plano aplicado" trocada de `<Select>` sempre-editável por texto
  simples + o novo `PlatformPlanChangeDialog` como ação explícita.
  Também: cada uma das 4 ações de status (ativar/trial/suspender/
  cancelar) ganhou uma `confirmDescription` específica em vez da
  descrição genérica adicionada na UI-041 — a de "Enviar para trial"
  agora explica o efeito real ("a clínica usa a plataforma normalmente,
  mas fica sem cobrança recorrente até ser marcada como ativa").

## Decisões arquiteturais

- **Fechamento do dialog é otimista** (`onSubmit={() => setOpen(false)}`
  no form nativo com `action={platformAssignClinicBillingPlanAction}`) —
  não convertido para chamada imperativa com `useTransition`/toast como
  `ClinicDialog` faz, para não reescrever a server action existente.
  Funciona bem no caso comum; se a ação falhar, o usuário só não vê o
  dialog reabrir automaticamente (a página revalida e mostra o estado
  real de qualquer forma).
- **Confirmação embutida no próprio mini-formulário**, não um
  `ConfirmDialog` em cima do `Dialog` — dois popups empilhados para uma
  mudança de plano pareceu fricção excessiva; o aviso amarelo + botão
  desabilitado até haver mudança real já impede o clique acidental que o
  QA relatou.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings (1 erro de aspas não escapadas
  corrigido durante a implementação).
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:billing` — ✅ 7 cenários.

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: a server action (`platformAssignClinicBillingPlanAction`) não
  foi alterada, só a camada de apresentação que a aciona.

## Próxima task sugerida

`UI-043-automatic-overdue-payment-status.md`.
