# UI-036 - Reconfirmar Botão de Colapsar da Sidebar — Relatório de Implementação

## Objetivo da task

Confirmar se o botão de colapsar ainda aparece sobreposto/incompleto, como
reportado no QA, e corrigir se o problema for real no build atual.

## Investigação

Reproduzi mentalmente a árvore de *stacking context* em vez de assumir
que o fix anterior (z-30 no botão) bastava. Achado: **o fix anterior era
insuficiente por um motivo diferente do que eu tinha corrigido antes.**

`position: sticky` sempre cria um novo *stacking context*. O botão
(`.sidebar-collapse-toggle`, `z-30`) fica dentro de
`.app-shell-sidebar-sticky`, que tem `position: sticky` mas **não tinha
`z-index` próprio** (ficava em `auto`). Um `z-index` alto num elemento só
importa *dentro* do stacking context do pai mais próximo que também é
posicionado — não "escapa" para competir com elementos de fora desse
contexto. Como `.app-shell-sidebar-sticky` (contexto do botão) e
`.app-shell-header` (`z-20`, contexto do topbar) acabam irmãos efetivos
no *root stacking context* (nenhum ancestral comum entre eles cria
contexto própria), quem decide a ordem é o z-index do **contêiner**
(`.app-shell-sidebar-sticky`, que era `auto`/0), não o do botão lá
dentro. Resultado: o topbar (`z-20`) sempre vencia, não importa o que o
botão tivesse.

## Arquivos modificados

- `app/globals.css` — `.app-shell-sidebar-sticky` ganhou `z-30` (antes só
  tinha `position: sticky` sem z-index). Agora o contexto de
  empilhamento inteiro da sidebar fica acima do topbar, e o `z-30` do
  botão (já existente) passa a valer de fato.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.

## Trabalho remanescente

Confirmação visual no navegador ainda pendente (sem ferramenta de
browser neste ambiente) — mas desta vez a causa raiz foi identificada de
forma conclusiva via análise da árvore de stacking context, não por
tentativa e erro.

## Riscos

- Nenhum: mudança isolada de `z-index` em um único seletor.

## Próxima task sugerida

`UI-037-action-button-tooltips.md`.
