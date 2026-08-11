# UI-039 - Workspace da Empresa: Densidade e Consolidação de Informação

## ⚠️ Precisa aprovação de escopo antes de iniciar

Esta task tem duas partes de natureza diferente: (A) densidade visual
(seguro, mesmo padrão das tasks anteriores) e (B) reestruturação de
arquitetura de informação — unificar abas em uma visão geral com links.
A parte B muda navegação e fluxo, não só aparência; confirmar com o
usuário antes de implementar essa parte.

## Objetivo da task

Reduzir a densidade visual do workspace completo de uma empresa cliente
(`/dashboard/clinics/[clinicId]`) e avaliar consolidar Assinatura SaaS,
Pagamentos e Identidade numa única "visão geral" com links discretos para
edição, mantendo Usuários e Módulos como áreas separadas mas mais
funcionais, e Auditoria como tabela simples e filtrável.

## Auditoria prévia (já feita)

Ver `docs/qa-ux-review-2026-08.md`, item 5.4 e seção "Proposta de
reestruturação de informação". Tela em
`features/clinic/components/platform-clinic-details-page.tsx` (última
alteração relevante: UI-014, que já migrou tabelas HTML cruas e adicionou
a aba Módulos).

## Escopo — Parte A (densidade, sem aprovação extra necessária)

- Reduzir tamanho de fonte, padding e quantidade de cards visíveis
  simultaneamente na aba "Visão geral" da empresa.
- O bloco de identidade da conta (razão social, endereço, etc.) deve
  ocupar menos espaço — considerar formato de ficha compacta em vez de
  grid de cards.

## Escopo — Parte B (reestruturação, aguardando aprovação)

- Unificar as abas Assinatura SaaS / Pagamentos / Identidade numa única
  visão, com resumo de cada uma + link discreto ("editar", "ver
  detalhes") que leva à ação correspondente, em vez de abas dedicadas.
- Aba Usuários: adicionar ações inline que hoje não existem aqui
  (editar, criar, trocar senha, pesquisar, desabilitar) — verificar
  reuso de `users-overview-panel.tsx`/`platform-users-overview-panel.tsx`
  em vez de duplicar lógica.
- Aba Módulos: adicionar toggle de ativar/desativar direto nesta tela
  (hoje, segundo a UI-014, isso só existe no workspace da própria
  clínica, não na visão de plataforma) — reaproveitar
  `ensureClinicModules`/ações já existentes em `features/modules`.
- Aba Auditoria: simplificar para tabela discreta com filtro por usuário
  e data (reaproveitar `audit-log-table.tsx` em vez de recriar).

## Critérios de aceite

- Parte A: tela visivelmente mais compacta, sem perda de informação.
- Parte B (se aprovada): navegação por link em vez de abas separadas para
  assinatura/pagamento/identidade; usuários e módulos com as novas ações
  inline; auditoria filtrável.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.
- `pnpm test:tenant`, `pnpm test:modules`, `pnpm test:users` sem regressão
  (parte B mexe em fluxo, não só em CSS).

## Restrições

- Não duplicar lógica de gestão de usuários/módulos já existente em
  outras features — reusar componentes.
- Parte B: não remover nenhuma capacidade que existe hoje, só mudar onde
  ela aparece.
