# UI-040 - Densidade Global — Segunda Rodada — Relatório de Implementação

## Objetivo da task

Aplicar a diretriz geral do QA a todas as telas ainda não cobertas:
fontes menores, menos bordas arredondadas em superfícies internas, botões
mais discretos com hover visível, formulários menos "exagerados".

## Decisão sobre a escala de fonte

Não mexi de novo em `--font-size-*` (UI-030 já reduziu). O que faltava,
pelo próprio texto do QA ("todos os formulários estão exagerados",
"botões sem hover"), era **altura de controle e raio de borda**, não
tamanho de letra — por isso o foco desta rodada foi aí.

## Arquivos modificados

- `components/ui/input.tsx` — `h-11` → `h-9`, `rounded-xl` → `rounded-lg`,
  padding vertical reduzido. Afeta todo campo de texto do app.
- `components/ui/textarea.tsx` — `min-h-24` → `min-h-20`, `rounded-xl` →
  `rounded-lg`, padding reduzido.
- `components/ui/button.tsx` — raio base `rounded-xl` → `rounded-lg`;
  tamanho `default` `h-10` → `h-9` (agora alinhado com a nova altura do
  `Input`); `icon`/`icon-sm`/`icon-lg` também com raio menor
  (`rounded-xl` → `rounded-lg`); `lg` ajustado de `h-12` para `h-11` para
  manter a progressão proporcional entre os tamanhos.
- `app/globals.css` — `.surface-subtle`, `.detail-field`, `.form-section`,
  `.attention-card`: raio `1rem` → `0.75rem`, padding reduzido um degrau;
  `.detail-field-label` com tracking menos espalhado (`0.2em` → `0.14em`,
  menos "gritado"); `.workspace-section-header`/`.workspace-toolbar` com
  padding reduzido; `.form-shell-body` idem.
- `features/clinic/components/clinic-dialog.tsx` — botão de
  mostrar/ocultar senha temporária (`<button>` cru) não tinha nenhum
  estado de hover — adicionado `transition-colors hover:text-foreground`,
  mesmo padrão do `PasswordInput` compartilhado.

## Decisões arquiteturais

- **Escopo ficou em altura/raio/hover, não em nova redução de fonte** —
  já muito coberto pela UI-030; empilhar outra redução de fonte sem
  necessidade arriscava passar do ponto de legibilidade.
- **Varredura por `<button>` cru fora de `components/ui/`** encontrou só
  1 ocorrência fora do escopo já corrigido em tasks anteriores
  (o toggle de senha do `clinic-dialog.tsx`) — o restante do app já usa o
  componente `Button` compartilhado, que sempre teve hover definido por
  variante.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- Rodei as 8 suítes do `CLAUDE.md` (`test:tenant`, `test:rbac`,
  `test:membership`, `test:contracts`, `test:billing`, `test:modules`,
  `test:audit`, `test:users`) por ser mudança de altíssima superfície
  (`Input`/`Button`/`Textarea` usados em todo formulário do app) — ✅
  todas passando.

## Trabalho remanescente

Nenhum identificado nesta rodada. Verificação visual ampla continua
pendente (sem ferramenta de navegador nesta sessão).

## Riscos

- **Médio**: mudança nos componentes-base de formulário tem a maior
  superfície de qualquer task desta fase — mitigado rodando a bateria de
  testes completa (não só as suítes tocadas diretamente) antes de fechar.

## Próxima task sugerida

`UI-041-destructive-action-confirmation-audit.md`.
