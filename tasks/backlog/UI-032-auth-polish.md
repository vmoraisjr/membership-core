# UI-032 - Login, Recuperação de Senha e Loading

## Objetivo da task

Corrigir os 3 achados de QA nas telas de autenticação: formulário grande
demais, linha visível no degradê de fundo, e loading com logo azul e
animação genérica.

## Auditoria prévia (já feita)

Ver `docs/qa-ux-review-2026-08.md`, seção 1–3.

- Formulário de login (`features/auth/components/login-form.tsx`) e o
  card de auth (`features/auth/components/auth-card.tsx`) usam a mesma
  escala de espaçamento/fonte das demais telas — grandes demais para
  caber sem rolagem em notebook.
- Linha visível no degradê: `auth-card.tsx` e `app/(auth)/login/page.tsx`
  têm um `<div class="h-56 bg-[radial-gradient(circle_at_top,...)]">`
  cujo raio de gradiente pode ultrapassar a altura fixa de 224px em telas
  largas, cortando o degradê antes de chegar a transparente.
- Loading: `login-form.tsx:134-154` — overlay de tela cheia com
  `SHEEP_SYMBOL_BLUE_PATH` (PNG azul) girando via `animate-spin`.

## Escopo

- Reduzir padding/gap/tamanho de fonte do formulário de login e do
  `AuthCard` (aplica a login, first-access, forgot-password,
  reset-password, todos usam `AuthCard`) o suficiente para caber em
  ~800px de altura sem rolagem.
- Trocar o wash `h-56 bg-[radial-gradient(...)]` por uma versão com
  `mask-image: linear-gradient(to bottom, black, transparent)` (ou
  equivalente) para garantir transparência total na borda inferior,
  eliminando o corte visível, em `auth-card.tsx` e `login/page.tsx`.
- Trocar `SHEEP_SYMBOL_BLUE_PATH` pelo `SheepIcon` (verde, já existe em
  `components/branding/sheep-mark.tsx`) no overlay de loading.
- Substituir o `animate-spin` do logo estático por uma animação mais
  autoral (ex.: pulso/glow usando os tokens `--duration-*`/`--ease-*` já
  existentes), respeitando `prefers-reduced-motion` (o overlay já tem
  `motion-reduce:animate-none`, só trocar o efeito em si).

## Critérios de aceite

- Login cabe em ~800px de altura sem rolagem (testar em viewport de
  notebook, ex. 1366×768).
- Nenhuma linha/corte visível no wash de fundo em nenhuma largura de tela.
- Loading com logo verde e animação própria, não genérica.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.

## Restrições

- Não alterar lógica de autenticação/submit, só apresentação.
