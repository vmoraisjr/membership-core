# UI-035 - Dashboard: Panorama Mais Sutil e Remoção de Seções — Relatório de Implementação

## Objetivo da task

Reduzir a altura da seção "Panorama da plataforma" e dos cards internos,
corrigir o respiro entre os cards das pontas e a borda da seção, remover
"Atalhos da plataforma" e "Cobertura por módulo".

## Arquivos modificados

- `features/dashboard/components/dashboard-home-page.tsx` — removido o
  bloco `<div className="page-section-grid ...">` inteiro que continha as
  seções "Atalhos da plataforma" (grade de `ActionCard`) e "Cobertura por
  módulo"; `SectionCard` de "Panorama da plataforma" ganhou
  `contentClassName="p-4"` para os cards não encostarem mais na borda da
  seção.
- `app/globals.css` — `.metric-tile-inner` reduzido mais um degrau
  (`px-3.5 py-3.5` → `px-3 py-3`, `gap-3` → `gap-2.5`) — afeta todo
  `MetricCard` do app, não só o dashboard, reduzindo a altura percebida
  em todas as telas com métricas.

## Decisões arquiteturais

- **`activeModuleCounts` mantido no service, só a UI foi removida.**
  Tentei inicialmente remover o cálculo (`prisma.module.findMany`) junto
  com a seção, por parecer código morto — mas
  `tests/tenant-isolation/cross-tenant-regression.test.ts` (cenário
  "Platform dashboard metrics stay production-relevant and scoped to real
  SaaS data") depende desse campo para validar que a contagem de clínicas
  habilitadas por módulo escala corretamente com novos tenants. É uma
  checagem de regressão válida sobre a query, independente de estar
  exibida na tela. Reverti a remoção do service; só o componente que
  renderizava os dados na tela foi removido.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:tenant` — ✅ 11 cenários (inclui o teste que quase quebrei
  com a remoção precipitada do service).

## Trabalho remanescente

Nenhum dentro do escopo desta task. Item 4.6 (manter "O que precisa de
atenção hoje") não precisou de ação — já está no formato aprovado desde
a rodada anterior.

## Riscos

- Baixo: a única mudança com risco real (remover computação usada em
  teste) foi identificada pelo próprio `typecheck` antes do build e
  revertida.

## Próxima task sugerida

`UI-036-sidebar-collapse-regression-check.md`.
