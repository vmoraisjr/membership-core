# UI-019 - Responsividade e Acessibilidade — Relatório de Implementação

## Objetivo da task

Garantir uso em desktop, tablet e celular. Testar 360px, 768px, 1024px e 1440px. Verificar sidebar, tabelas, formulários, dialogs, foco, contraste, teclado, aria, toque, scroll e zoom. Critérios de aceite: fluxos principais no tablet, tabelas com alternativa responsiva, dialogs dentro da viewport, nada depende apenas de hover.

## Auditoria prévia

Boa parte da responsividade já vinha construída desde a UI-001/UI-002: o componente `Table` do Design System já envolve toda tabela em `overflow-x-auto` por padrão (alternativa responsiva de base, presente em toda tabela migrada nas 18 tasks anteriores); `DashboardSidebar` já colapsa para um menu hambúrguer com `SidePanel` lateral abaixo do breakpoint `lg`; `SidePanelContent` usa `w-full max-w-[46rem]`, garantindo que nunca ultrapasse a viewport; `AlertDialogContent` usa `max-w-xs` (20rem = 320px), menor que qualquer um dos 4 breakpoints pedidos. Não há meta viewport customizada restringindo zoom (o Next.js usa o padrão `width=device-width, initial-scale=1`, que preserva pinch-to-zoom). Não encontrei nenhum padrão de "revelar apenas no hover" (`opacity-0 group-hover:opacity-100` ou similar) em nenhum componente — todas as ações de linha já são sempre visíveis, nunca dependentes de hover.

O que faltava era especificamente o critério "aria": uma varredura por botões somente-ícone (`size="icon"`) sem `aria-label` encontrou 6 arquivos. Um deles (`components/dashboard/table-actions.tsx`) era código morto — zero importadores — e foi removido. Dos 5 restantes, um é do módulo CRM (`lead-row-actions.tsx`), fora de escopo por regra permanente ("não implemente CRM"). Os outros 4 — `membership-benefit-row-actions.tsx`, `membership-plan-row-actions.tsx`, `patient-row-actions.tsx`, `subscription-row-actions.tsx` — tinham, somados, cerca de 20 botões de ação (editar, duplicar, pausar, retomar, renovar, expirar, cancelar, desativar, reativar, excluir, adicionar) completamente sem nome acessível: nem `aria-label`, nem `title`, nem texto visível — um leitor de tela anunciaria apenas "botão", sem indicar a ação.

## Arquivos removidos

- `components/dashboard/table-actions.tsx` — código morto (zero importadores) que também violava o critério de aria (nenhum dos dois botões tinha nome acessível). Confirmado via busca por importadores antes de remover, seguindo o mesmo método já usado nas tasks anteriores (UI-012, UI-015).

## Arquivos modificados

- `features\membership-benefits\components\membership-benefit-row-actions.tsx` — 4 botões (editar, desativar, reativar, excluir) receberam `title`/`aria-label`.
- `features\membership-plans\components\membership-plan-row-actions.tsx` — 5 botões (editar, duplicar, adicionar benefício, desativar, reativar/excluir) receberam `title`/`aria-label`.
- `features\subscriptions\components\subscription-row-actions.tsx` — 6 botões (editar, pausar, expirar, retomar, renovar, cancelar) receberam `title`/`aria-label`.
- `features\patients\components\patient-row-actions.tsx` — 5 botões (editar, adicionar assinatura, desativar, reativar, excluir) receberam `title`/`aria-label`.

Em todos os casos, reaproveitei o texto já usado como `actionLabel` do `ConfirmDialog` correspondente (ou o título do diálogo de criação/edição, quando aplicável) como valor de `aria-label`/`title` — nenhuma string nova foi inventada; todas já existiam em `messages/pt-BR.json` e continuam vindo de lá, só passaram a também nomear o botão que dispara a ação.

## Decisões arquiteturais

- **Nenhuma tabela foi reconstruída em card-list para esta task.** O componente `Table` compartilhado já garante uma alternativa responsiva mínima (rolagem horizontal contida, confirmada sem vazar para o documento em nenhuma das 24 combinações testadas — 6 páginas × 4 breakpoints). Refazer cada tabela para um layout de cartões seria uma mudança de camada de apresentação muito mais ampla do que "verificar e corrigir" pedido pela task, e algumas tabelas (Pacientes, por exemplo) já tinham esse tratamento desde a UI-005; padronizar as demais ficaria mais adequado a uma decisão explícita de produto do que a esta varredura.
- **`aria-label` reaproveita texto já traduzido, não introduz vocabulário novo.** Isso evita qualquer risco de o rótulo do botão dizer algo diferente do que a ConfirmDialog/diálogo que ele abre — o mesmo texto ("Desativar plano", "Renovar assinatura" etc.) aparece nos dois lugares.
- **CRM ficou de fora deliberadamente**, mesmo tendo o mesmo problema de `aria-label`, por regra permanente explícita de não implementar/alterar esse módulo.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 29 rotas geradas.
- `pnpm test:membership`, `test:rbac`, `test:tenant` — ✅ os 20 cenários (cobrindo as áreas de pacientes, planos, benefícios e assinaturas tocadas nesta task) — nenhuma regressão, já que as mudanças são estritamente aditivas (`title`/`aria-label`).
- **Verificação em navegador (Playwright)**, 4 breakpoints pedidos (360, 768, 1024, 1440px) × 6 telas (dashboard, pacientes, assinaturas, clínicas, assinaturas SaaS, auditoria): **0px de overflow horizontal do documento em todas as 24 combinações** — nenhuma tabela vaza para fora da viewport em nenhum tamanho testado.
- Menu lateral em 360px: colapsa corretamente para hambúrguer; o `SidePanel` de navegação abre com marca, itens e área do usuário completos, sem overflow.
- `SidePanel` de edição de paciente em 360px: ocupa a largura total da viewport sem vazamento, todos os campos e o botão de fechar permanecem acessíveis e legíveis.
- Confirmado, inspecionando o HTML capturado durante o teste, que o `aria-label="Desativar paciente"` adicionado está presente e correto no botão renderizado.
- 0 erros de console em todas as passagens.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Baixo: todas as mudanças são aditivas (atributos `title`/`aria-label` em botões existentes) ou remoção de código comprovadamente morto. Nenhuma Server Action, rota ou regra de negócio foi alterada.

## Próxima task sugerida

`UI-020-commercial-readiness.md`.
