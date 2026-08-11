# UI-040 - Densidade Global — Segunda Rodada

## Objetivo da task

Aplicar a diretriz geral do QA a todas as telas ainda não cobertas pela
Fase 2: fontes menores, menos bordas arredondadas em superfícies internas
(não só modais), botões mais discretos com hover visível, menos
`Card`/`SectionCard` por tela. Citação literal do QA (critério de
aceite):

> "precisamos de uma interface fácil com botoes discretos, fontes
> pequenas, menus discretos, menos bordas arredondadas. todos os
> formulários estao exagerados."

## Auditoria prévia (já feita)

Ver `docs/qa-ux-review-2026-08.md`, seção "Diretriz geral". A UI-030 já
reduziu a escala de fonte nos tokens globais (`--font-size-*`); a UI-021
já unificou o raio de superfícies grandes (modal/card). O que falta,
segundo o QA, é ir além nesses dois eixos e revisar formulários
especificamente (hoje usam `.detail-field`/`.form-section` com padding
generoso).

## Escopo

- Reavaliar (não necessariamente reduzir de novo) a escala de fonte da
  UI-030 à luz deste feedback mais recente — pode ser que precise de mais
  um degrau, ou que os outros itens (raio, cards) resolvam a percepção
  sem mexer em fonte de novo. Decidir com base em uma amostra visual.
- `.form-section`/`.detail-field`/`.surface-subtle` (globals.css): reduzir
  padding e considerar remover borda arredondada grande em favor de um
  visual mais plano (linha divisória simples em vez de card com borda,
  onde fizer sentido).
- Auditar telas fora do escopo das UI-022 a UI-028 (Catálogo comercial,
  Pagamentos SaaS, Módulos, formulários de criação/edição em geral) e
  aplicar o mesmo tratamento de densidade.
- Botões: revisar se todos os `variant="outline"`/`"ghost"` têm um estado
  de hover perceptível (o QA menciona "botões sem hover" no workspace da
  empresa).

## Critérios de aceite

- Amostra de pelo menos 6 telas (incluindo as citadas no QA) revisada e
  visivelmente mais discreta.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.

## Restrições

- Mudança de tokens globais tem efeito amplo — testar em várias telas
  antes de considerar concluída, como já fez a UI-031.
