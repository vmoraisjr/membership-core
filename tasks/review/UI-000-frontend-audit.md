# UI-000 - Auditoria Completa do Frontend Atual — Relatório de Implementação

## Objetivo da task

Catalogar telas, componentes, formulários, estados e inconsistências do frontend atual antes de qualquer alteração de código, entregando `docs/frontend-audit.md`.

## Arquivos criados

- `docs/frontend-audit.md` — auditoria completa: inventário de todas as rotas ativas com classificação (manter/redesenhar/substituir/consolidar/remover da navegação V1), mapeamento do shell e da biblioteca compartilhada, lista consolidada de duplicações e código morto (com caminhos de arquivo), sinais de responsividade, fluxos críticos ponta a ponta e ordem recomendada de substituição alinhada ao `README-FRONTEND.md`.

## Arquivos modificados

Nenhum. Este levantamento foi somente leitura.

## Metodologia

- Exploração exaustiva de `apps/web/app`, `apps/web/features/*` (18 features), `apps/web/components/{layout,dashboard,ui}` e `apps/web/features/shared`.
- Rastreamento de 5 fluxos críticos ponta a ponta (login, criação de paciente, criação de assinatura, uso de benefício, pagamento/fatura).
- Busca de importadores para identificar componentes/rotas órfãs (código morto).

## Principais achados

- 3 telas com ~530 + 625 linhas de código morto/inalcançável (`billing-page.tsx` branch de plataforma; `modules-page.tsx` completo).
- Rota `/dashboard/modules` é um redirect morto — nunca renderiza `ModulesPage`.
- `/dashboard/contracts` permanece acessível via URL direta apesar de estar fora do menu (diferente do CRM, que usa `notFound()`).
- `components/ui/select.tsx` e `components/ui/dropdown-menu.tsx` existem mas nunca são usados; 47 ocorrências de `<select>` HTML cru em 23 arquivos.
- `features/users/components/{users-overview-panel,platform-users-overview-panel}.tsx` duplicam a mesma lógica em paralelo (873 + 904 linhas).
- i18n fragmentado: várias features (`membership-benefits`, `benefit-usage`, `contracts`, `messages`, `modules`) estão total ou parcialmente fora de `messages/pt-BR.json`.
- Sem suporte a drawer/hambúrguer mobile no shell; tabelas dependem exclusivamente de scroll horizontal.
- Detalhe completo, com caminhos de arquivo, em `docs/frontend-audit.md`.

## Decisões arquiteturais

Nenhuma decisão de arquitetura foi tomada nesta task — é um levantamento factual. A única decisão de enquadramento foi usar a ordem já definida em `tasks/backlog/README-FRONTEND.md` (UI-001 → UI-020) como ordem recomendada de substituição, validando-a contra os achados (seção 6 do relatório).

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` / `pnpm build` — não executados: a mudança se limitou à criação de um arquivo Markdown, sem superfície de impacto em TypeScript ou build (critério "execute conforme impacto" da própria task).
- Nenhum teste automatizado é aplicável (não houve alteração funcional).

## Trabalho remanescente

Implementação visual das telas catalogadas — fora do escopo desta task, a ser feito UI-001 em diante.

## Riscos

- A rota `/dashboard/contracts` acessível por URL direta é um achado de comportamento (não apenas visual); qualquer decisão de bloqueá-la via `notFound()` deve ser validada com o time antes de ser executada em uma task futura, pois está fora do escopo puramente visual da UI-000.
- O gap de documentação sobre o módulo `messages` (ausente de `docs/ai-context.md`) foi registrado como observação, mas não foi corrigido — não é código de frontend e está fora do escopo desta task.

## Próxima task sugerida

`UI-001-design-system-foundation.md` (próxima na ordem obrigatória do `README-FRONTEND.md`). Não iniciada — aguardando aprovação humana desta task, conforme regra "uma task por vez / não iniciar a próxima automaticamente".
