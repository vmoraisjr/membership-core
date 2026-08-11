# UI-027 - Usuários: Avatar por Pessoa — Relatório de Implementação

## Objetivo da task

Avaliar e aplicar avatar colorido por pessoa nas listagens de usuários. Os
botões de ação já estavam no padrão compacto desde a Fase 1.

## Decisão arquitetural

Confirmando a decisão já registrada na UI-022: `CompanyAvatarMark` é
reutilizado sem alterações e sem criar um `PersonAvatarMark` — o cálculo de
iniciais (duas primeiras palavras do nome) é idêntico para pessoa ou
empresa, e as duas telas de usuários já tinham `user.id` disponível para
usar como seed estável.

## Arquivos modificados

- `features/users/components/users-overview-panel.tsx` — `CompanyAvatarMark`
  (seed = `user.id`) antes do nome, na listagem de usuários da clínica.
- `features/users/components/platform-users-overview-panel.tsx` — mesma
  mudança, na listagem de usuários da plataforma.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm test:users` — ✅ 4 cenários.
- `pnpm test:rbac` — ✅ 5 cenários.

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: mudança de apresentação, nenhuma server action alterada.

## Próxima task sugerida

`UI-028-audit-modules-density-rollout.md`.
