# UI-021 - Sistema de Bordas e Superfícies — Relatório de Implementação

## Objetivo da task

Unificar o raio de borda usado em superfícies de nível "modal/card grande"
(auth card, dialog, alert-dialog), hoje com três valores concorrentes
(`2rem`, `1.25rem`, `xl`), causa direta da sensação de "bordas arredondadas
aplicadas em cima de um sistema antigo" apontada no diagnóstico inicial.

## Auditoria prévia

Já feita em `docs/frontend-rebrand-audit.md`, seção 3, antes desta task.
Confirmado ao editar: `components/ui/side-panel.tsx` não tem `border-radius`
(painel ocupa a altura inteira da tela, encostado na borda — correto, não
precisa de raio). `features/clinic/components/clinic-dialog.tsx:420`
(dropzone de logo) já estava em `1.25rem`, não precisou de alteração.

## Arquivos modificados

- `features/auth/components/auth-card.tsx` — `rounded-[2rem]` → `rounded-[1.25rem]`.
- `app/(auth)/login/page.tsx` — `rounded-[2rem]` → `rounded-[1.25rem]`.
- `components/ui/alert-dialog.tsx` — `rounded-xl` → `rounded-[1.25rem]` no
  content; `rounded-b-xl` → `rounded-b-[1.25rem]` no footer (o `rounded-xl`
  do Tailwind é 12px, não usa os tokens `--radius-*` do projeto — por isso
  destoava mesmo "parecendo" próximo do valor alvo).

## Decisões arquiteturais

- **`1.25rem` como raio único** para toda superfície de nível modal/card
  grande, por já ser o valor de `components/ui/dialog.tsx`,
  `.surface-card` e `.workspace-section` — evita introduzir um quarto valor.
- **`dialog.tsx` não foi tocado** — já estava no valor alvo, conforme
  auditoria prévia.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: mudança é só de classe Tailwind (raio de borda), sem lógica alterada.

## Próxima task sugerida

`UI-022-patients-density-rollout.md`.
