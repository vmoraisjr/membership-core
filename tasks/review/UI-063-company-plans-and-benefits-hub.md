# UI-063 — Hub Planos: Oferta Local e Benefícios — Relatório de Implementação

## Entrega

- O catálogo (`/dashboard/planos`) e o detalhe do plano
  (`/dashboard/planos/[planoId]`) já eram as rotas canônicas desde a
  UI-059; os links internos que ainda apontavam para as rotas antigas
  foram corrigidos: o nome do plano na listagem agora usa `planoUrl`, o
  link secundário "Abrir suporte de benefícios" (que levava à tela global
  `/dashboard/benefits`) foi removido — ver o plano já mostra os
  benefícios embutidos, então o link era um caminho redundante para o
  mesmo destino.
- **Detalhe do plano**: a seção "Benefícios do plano" deixou de ser
  somente leitura. Agora tem a ação **"Criar benefício"** no cabeçalho
  (mesmo `MembershipBenefitDialog` da tela antiga) e cada linha ganhou
  `MembershipBenefitRowActions` (editar, desativar/reativar, excluir
  permanentemente) — toda manutenção de benefício acontece dentro do
  plano, sem sair para outra tela. A seção "Assinantes" trocou o link
  para o paciente pela rota canônica do cliente
  (`clienteUrl(id, {tab:"membership", returnTo: planoUrl(planId)}`) e o
  status de assinatura agora usa o mesmo badge (`SubscriptionStatusBadge`)
  usado no workspace do cliente (UI-062), em vez de texto cru do enum. O
  botão "Voltar para planos" também foi corrigido para a rota canônica.
- **Linha da listagem de planos**: as até cinco ações em ícone (ver,
  editar, duplicar, novo benefício, desativar) foram consolidadas em
  **"Ver plano"** (ação primária) + um menu **"Ações"** com Editar,
  Duplicar, Criar benefício e Desativar (ou Reativar/Excluir quando o
  plano está inativo) — mesmo padrão de menu de linha adotado na UI-061
  para Clientes, incluindo os gatilhos ocultos que preservam exatamente
  os diálogos e confirmações já existentes.
- **"Benefícios" como item lateral separado e a rota antiga**: já haviam
  sido resolvidos nas UI-059/UI-060 (`clinicLegacyHidden` no item da
  sidebar; `/dashboard/benefits` já redireciona para o plano em contexto
  ou para o catálogo). Verificado nesta task, sem necessidade de mudança
  adicional.
- **Plano da empresa vs. Plano comercial Sheep**: os dois só aparecem
  para públicos diferentes (o catálogo local é visível à empresa; "Planos
  comerciais" é uma entrada exclusiva da plataforma) e usam rótulos
  distintos em toda a interface (`plans.title` = "Planos" vs. "Planos
  comerciais"), então não há ponto de ambiguidade real na navegação atual
  — nenhuma mudança adicional foi necessária para este critério.

## Fora do escopo (confirmado intocado)

- Benefícios já contratados, consumos passados e regras de limite não
  foram alterados.
- Planos comerciais da plataforma (`ClinicBillingPlan`,
  `/dashboard/planos-comerciais`) não foram tocados.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.
- `pnpm test:membership` — 4 cenários passaram.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:rbac` — 5 cenários passaram.
- Playwright (build de produção, roteiro descartável após validação):
  `/dashboard/plans` e `/dashboard/benefits` redirecionam para
  `/dashboard/planos`; criação de plano; menu de linha com "Ver plano" +
  "Ações" (contendo "Criar benefício"); abrir o plano e criar um
  benefício diretamente na página, com edição/desativação disponíveis por
  linha; duplicar plano pelo menu; desativar plano pelo menu (some do
  filtro padrão "Ativos"); localizar o plano inativo pelo filtro de
  status e confirmar que o menu oferece "Reativar plano".

## Próxima task

UI-064 — Cobranças: Fila Financeira e Contexto do Cliente.
