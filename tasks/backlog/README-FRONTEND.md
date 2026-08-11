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

## Fase 3 — QA/UX Agosto 2026 (backlog, ainda não iniciada)

Origem: `qa-ux review.pdf` anexado pelo usuário. Entendimento em
`docs/qa-ux-review-2026-08.md`.

UI-032 (login/loading) → UI-033 (breadcrumb) → UI-034 (hero dashboard +
menu de usuário) → UI-035 (panorama/remoção de seções) → UI-036
(reconfirmar botão de colapsar) → UI-037 (tooltips) → UI-038 (visão
rápida) → UI-039 (workspace da empresa — **parte B precisa aprovação de
escopo**) → UI-040 (densidade global, 2ª rodada) → UI-041 (auditoria de
confirmação em ações destrutivas) → UI-042 (fluxo de troca de plano) →
UI-043 (bug: status atrasado automático) → UI-044 (bug: catálogo só edita
um item) → UI-045 (bug: erro de hidratação em Módulos) → UI-046
(reestruturação de Chamados — **precisa aprovação de escopo**)

## Fluxo

`backlog → in-progress → review → done`

## Regras

- Uma task por vez.
- Não iniciar a próxima automaticamente.
- Aprovação humana antes de `done`.
- Não alterar backend ou regra de negócio para acomodar decisões visuais
  (exceção: UI-039/UI-041/UI-042/UI-043/UI-044/UI-045 têm componente
  funcional explícito, não são puramente visuais).
- Não ativar/alterar CRM (`features/crm`) nem `features/contracts`
  (dormente, fora do V1). `features/messages` (Chamados) **não** está
  nessa lista — é o sistema de tickets operacionais plataforma↔clínica,
  já confirmado em uso real, distinto do "Communication hub" (WhatsApp/
  Instagram/Inbox) que o CLAUDE.md bloqueia.
- Todo texto novo deve usar i18n pt-BR.
