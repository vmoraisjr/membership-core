# UI-030 - Revisão da Escala Tipográfica — Relatório de Implementação

## Objetivo da task

Reduzir a escala de fontes global (`--font-size-*`/`--line-height-*` em
`app/globals.css`), sensivelmente maior que a do mockup aprovado em todo
degrau, e provável causa raiz de "elementos muito grandes" — mais
estrutural do que espaçamento isolado.

## Decisão de escala

Reduzi de forma progressiva, mais agressiva nos degraus grandes (títulos)
do que nos pequenos (corpo/rótulos), para não comprometer legibilidade de
texto corrido:

| Token | Antes | Depois |
|---|---|---|
| xs | 12/16 | 12/16 (mantido — já é o menor, achatar mais arriscava legibilidade) |
| sm | 14/20 | 13.5/19 |
| md | 16/24 | 15/21 |
| lg | 18/28 | 16.5/23 |
| xl | 20/30 | 18/25 |
| 2xl | 24/32 | 21/27 |
| 3xl | 30/38 | 24/30 |
| 4xl | 36/44 | 28/34 |

`--font-size-3xl` é o token de `.workspace-title` (título de cada página) —
30px→24px é a redução mais visível e diretamente relacionada à queixa
original.

## Arquivos modificados

- `app/globals.css` — tokens acima.
- `app/not-found.tsx`, `app/error.tsx`, `app/(dashboard)/error.tsx` —
  `text-2xl` → `text-xl` no título da página de erro.
- `app/global-error.tsx` — `text-3xl` → `text-2xl`.
- `features/billing/components/platform-commercial-catalog-page.tsx` — 3
  tiles de estatística: `p-5 text-3xl` → `p-4 text-2xl tabular-nums`.
- `features/modules/components/modules-page.tsx` — 4 tiles de
  estatística: `p-4 text-3xl` → `p-4 text-2xl tabular-nums`.
- `features/users/components/users-overview-panel.tsx` — 2 valores de
  estatística: `text-2xl` → `text-xl tabular-nums`.

## Decisões arquiteturais

- **Essas 9 ocorrências usam classes Tailwind (`text-3xl`/`text-2xl`)
  diretamente, não os tokens `--font-size-*` do projeto** — são duas
  escalas independentes (a do Tailwind e a customizada do app), por isso
  precisaram de edição manual arquivo por arquivo em vez de herdar a
  mudança dos tokens automaticamente.
- **`tabular-nums` adicionado nos tiles de estatística editados** — eram
  números isolados sem essa propriedade; ficou inconsistente deixar de
  fora agora que estou tocando essas linhas mesmo assim.
- **`xs` não foi reduzido** — já é o menor da escala (12px), usado em
  legendas e rótulos; reduzir mais arriscava ficar ilegível.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:contracts` — ✅ 5 cenários (suíte que ainda não tinha rodado
  nesta sequência de tasks).

## Trabalho remanescente

Nenhum identificado. Como é uma mudança de token global, vale uma
conferência visual ampla (várias telas) antes de aprovar — é exatamente o
escopo da UI-031.

## Riscos

- **Médio-baixo**: mudança de tokens globais tem superfície ampla (afeta
  texto em todo o app). Mitigado por manter a redução moderada (não
  idêntica à prévia agressiva do artifact) e não reduzir o degrau `xs`.
  Nenhum teste automatizado cobre tipografia — a validação real é visual,
  a cargo da UI-031.

## Próxima task sugerida

`UI-031-final-brand-sweep.md`.
