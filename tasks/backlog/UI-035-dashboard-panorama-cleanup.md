# UI-035 - Dashboard: Panorama Mais Sutil e Remoção de Seções

## Objetivo da task

Reduzir a altura da seção "Panorama da plataforma" e dos cards internos,
corrigir o respiro entre os cards das pontas e a borda da seção, remover
"Atalhos da plataforma" e "Cobertura por módulo".

## Auditoria prévia (já feita)

Ver `docs/qa-ux-review-2026-08.md`, itens 4.4, 4.5, 4.7, 4.8. As 3 seções
ficam em `features/dashboard/components/dashboard-home-page.tsx`, bloco
`metrics.platformMetrics`.

## Escopo

- `MetricGrid`/`.metric-tile`: já reduzidos na UI-030/UI-021, mas ainda
  "altos" segundo o QA — reduzir mais um degrau (padding vertical,
  `min-height` se houver) especificamente nesta seção ou globalmente se
  fizer sentido para todas as telas que usam `MetricCard`.
- Grade de métricas: adicionar padding lateral na seção (`SectionCard`)
  ou `gap` extra para que os cards das pontas não encostem na borda
  externa.
- Remover completamente a seção "Atalhos da plataforma" (bloco de
  `ActionCard`s com Empresas clientes/Assinaturas SaaS/Pagamentos
  SaaS/Chamados/Usuários/Auditoria) — a navegação já existe na sidebar.
- Remover completamente a seção "Cobertura por módulo".

## Critérios de aceite

- "Panorama da plataforma" visivelmente mais compacto, sem cards
  encostando na borda da seção.
- "Atalhos da plataforma" e "Cobertura por módulo" não aparecem mais na
  tela.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.

## Restrições

- Não remover "O que precisa de atenção hoje" — explicitamente mantida
  (item 4.6 do QA).
- Confirmar se algum dado hoje só exibido em "Cobertura por módulo"
  (contagem de clínicas por módulo) precisa de outro lugar antes de
  remover — se não houver outro consumidor dessa informação, ok remover
  junto com o código que a calcula (evitar deixar service morto).
