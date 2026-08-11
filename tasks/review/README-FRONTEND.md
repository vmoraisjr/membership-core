# Sheep Frontend Transformation

## Fase 1 — Fundação (concluída, em `tasks/review`)

UI-000 → UI-001 → UI-002 → UI-003 → UI-004 → UI-005 → UI-006 → UI-007 → UI-008 → UI-009 → UI-010 → UI-011 → UI-012 → UI-013 → UI-014 → UI-015 → UI-016 → UI-017 → UI-018 → UI-019 → UI-020

## Fase 2 — Rebrand (identidade esmeralda/ciano) (concluída, em `tasks/review`)

Auditoria em `docs/frontend-rebrand-audit.md`.

UI-021 (bordas/superfícies) → UI-022 (pacientes) → UI-023 (planos) →
UI-024 (benefícios/uso) → UI-025 (assinaturas) → UI-026 (pagamentos) →
UI-027 (usuários) → UI-028 (auditoria/módulos) → UI-029 (controles nativos
restantes — nenhum gap real encontrado) → UI-030 (escala tipográfica) →
UI-031 (varredura final)

Aguardando aprovação humana (verificação visual no navegador) antes de
mover para `tasks/done`.

## Fluxo

`backlog → in-progress → review → done`

## Regras

- Uma task por vez.
- Não iniciar a próxima automaticamente.
- Aprovação humana antes de `done`.
- Não alterar backend ou regra de negócio para acomodar decisões visuais.
- Não ativar/alterar CRM, agenda, agendamento ou comunicação (`features/crm`,
  `features/messages`) nem `features/contracts` (dormente, fora do V1).
- Todo texto novo deve usar i18n pt-BR.
