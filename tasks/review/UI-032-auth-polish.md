# UI-032 - Login, Recuperação de Senha e Loading — Relatório de Implementação

## Objetivo da task

Corrigir os 3 achados de QA nas telas de autenticação: formulário grande
demais, linha visível no degradê de fundo, e loading com logo azul e
animação genérica.

## Arquivos modificados

- `app/(auth)/login/page.tsx` — reduzido: ícone/wordmark do lockup (h-16/20
  + text-3xl/4xl → h-9 + text-lg), título (2.15rem → 1.3rem no maior
  breakpoint), espaçamentos verticais (mt-8→mt-4/5, space-y-4→space-y-2),
  padding das duas colunas (py-8/12 → py-6/8), rodapé (mt-8→mt-4). Wash de
  fundo ganhou a classe `auth-wash`.
- `features/auth/components/auth-card.tsx` — mesma redução de escala
  (usado por forgot-password, first-access, reset-password): título
  text-xl→text-lg, descrição text-sm→text-xs, paddings/margens reduzidos
  em ~30-40%. Wash ganhou `auth-wash`.
- `features/auth/components/login-form.tsx` — `space-y-5`→`space-y-3`,
  `Input`/`PasswordInput` com `h-9 text-sm` (override local, não mexe no
  tamanho padrão usado no resto do app), botão de submit sem `size="lg"`
  (volta ao padrão `h-10`), loading overlay trocado de `<Image
  src={SHEEP_SYMBOL_BLUE_PATH}>` girando para `<SheepIcon
  className="auth-loading-mark">` com animação de pulso/glow própria.
- `app/globals.css` — nova classe `.auth-wash` (`mask-image:
  linear-gradient(to bottom, black, transparent)`) aplicada ao wash de
  fundo em ambas as telas; nova classe `.auth-loading-mark` +
  `@keyframes auth-mark-pulse` (escala + sombra pulsando entre as duas
  cores da marca), com `prefers-reduced-motion` respeitado.

## Decisões arquiteturais

- **Causa da linha no degradê confirmada e corrigida via `mask-image`,
  não via ajuste de percentual do gradiente.** O gradiente radial
  `circle_at_top` calcula o raio a partir da distância até o canto mais
  distante da própria caixa — como a caixa é `inset-x-0` (largura total
  da viewport) mas só 224px de altura, em telas largas esse raio pode
  ultrapassar a altura da caixa antes de chegar a "transparent",
  cortando o degradê exatamente na borda inferior. `mask-image` garante
  transparência total na borda da caixa **independente** do cálculo do
  raio — resolve a causa, não só o sintoma, e funciona em qualquer
  largura de tela.
- **`Input`/`PasswordInput` reduzidos só localmente no login** (via
  `className` na instância, não no componente base) — evita afetar
  formulários em outras 20+ telas antes da UI-040 (densidade global)
  decidir se o tamanho padrão do app muda.
- **`AuthCard` reduzido de forma compartilhada** (diferente do login, que
  tem página própria) porque forgot-password/first-access/reset-password
  usam o mesmo componente — resolve o item 2 do QA (recuperação de senha)
  automaticamente.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.

## Trabalho remanescente

- Verificação visual em viewport de notebook (1366×768) para confirmar
  que o login cabe sem rolagem — não foi possível nesta sessão (sem
  ferramenta de navegador).

## Riscos

- Baixo: mudanças de apresentação em componentes de autenticação, nenhuma
  lógica de submit/validação alterada.

## Próxima task sugerida

`UI-033-breadcrumb-current-item.md`.
