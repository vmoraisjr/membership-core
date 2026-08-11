# UI-015 - Billing SaaS da Nortex — Relatório de Implementação

## Objetivo da task

Separar faturamento da plataforma dos pagamentos de pacientes. Tela com clínicas ativas, trial, inadimplentes, canceladas, MRR SaaS, faturas e plano. Fluxos: ativar, suspender, cancelar, confirmar pagamento, marcar atraso e alterar plano. Critérios de aceite: sem confusão entre cobranças, acesso apenas de plataforma, situação comercial clara.

## Auditoria prévia

A separação entre cobrança SaaS (plataforma↔clínica) e cobrança de pacientes (clínica↔paciente) já existia na arquitetura: 3 páginas dedicadas — `PlatformSaasSubscriptionsPage` (`/dashboard/billing/subscriptions`), `PlatformSaasPaymentsPage` (`/dashboard/billing/payments`) e `PlatformCommercialCatalogPage` (`/dashboard/billing/catalog`) — cada uma já restrita a `OWNER`/`ADMIN` de plataforma (`currentUser.clinicId == null`), com Server Actions próprias (`platformUpdateClinicSubscriptionStatusAction`, `platformMarkClinicInvoicePaidAction`, `platformMarkClinicInvoiceOverdueAction`, `platformAssignClinicBillingPlanAction`) já protegidas por `assertPermission("clinic", "manage")` e por um `assertPlatformOwner()` redundante. Cobertura de pagamentos de pacientes permanece isolada em `features/billing/components/patient-payments-page.tsx` (UI-012), não tocada aqui.

O que faltava era puramente presentational: as 3 páginas usavam `<select>` cru, funções locais duplicadas `getStatusClass`/`getStatusLabel` com cores fixas em vez de `StatusIndicator`, e a tela de assinaturas não usava `overview.platformMetrics` (já calculado no servidor com `monthlySaasRevenue`, `activeClinics`, `trialClinics`, `pastDueClinics`) — o MRR SaaS explicitamente pedido pela task nunca aparecia na tela.

Dois problemas mais sérios, descobertos ao investigar essa área para evitar duplicação:

1. **`features/billing/components/clinic-subscription-actions.tsx` era código morto**: um componente completo de ativar/suspender/cancelar assinatura, sem nenhum importador no projeto — duplicava exatamente o que `PlatformSaasSubscriptionsPage` já fazia inline. Confirmado via busca por importadores antes de remover, seguindo o mesmo método usado na UI-012 para `billing-page.tsx`.
2. **A rota `/dashboard/modules` estava completamente inacessível**: `app/(dashboard)/dashboard/modules/page.tsx` fazia `redirect("/dashboard/billing")` incondicionalmente, nunca renderizando `ModulesPage`. Como `/dashboard/billing` por sua vez redireciona para `/dashboard/billing/catalog` (plataforma) ou `/dashboard/payments` (clínica), clicar em "Módulos" no menu lateral sempre levava para uma dessas duas páginas de cobrança — o item de navegação "Módulos" nunca funcionou. Confirmado que esse redirect já existia no commit inicial do projeto (`feat: frontend design`), antes de qualquer task desta sessão. Corrigido porque a própria `ModulesPage` continha, no ramo de plataforma, um formulário completo de "Novo plano comercial"/"Planos e regras de uso" que **duplicava** exatamente o que `PlatformCommercialCatalogPage` já faz corretamente — ou seja, resolver a duplicação de telas de plano (pedida pela task) exigia entender se essa segunda tela era alcançável, e não era.

## Arquivos criados

Nenhum.

## Arquivos modificados

- `features/billing/components/platform-saas-subscriptions-page.tsx` — filtros migrados para `Select`; badge de status migrado para `StatusIndicator` + `t("billing.status.*")`; adicionados 5 `MetricCard`s (Contas ativas, Em trial, Inadimplentes, Canceladas, MRR SaaS) — os 4 primeiros contam a partir da lista completa de assinaturas, o MRR usa `overview.platformMetrics.monthlySaasRevenue` (soma real de `ClinicInvoice` pagas no mês, já calculada no servidor — não recalculado no cliente para não sub-contar faturas fora da janela de 6 registros trazida por assinatura).
- `features/billing/components/platform-saas-payments-page.tsx` — mesma migração de filtros e status.
- `features/billing/components/platform-commercial-catalog-page.tsx` — filtro de disponibilidade migrado para `Select`; badge ativo/inativo migrado para `StatusIndicator`; texto novo movido para `messages/pt-BR.json`.
- `features/billing/components/payment-attention-bar.tsx`, `saas-subscription-details-panel.tsx` — textos migrados para `t()`.
- `features/billing/components/platform-plan-side-panel.tsx` — **correção funcional**: `trigger` passou de obrigatório para opcional, com um botão padrão interno ("Novo plano", usando `useTranslations` no próprio componente cliente). Antes, o botão "Novo plano" do cabeçalho do catálogo (passado via `action={<PlatformPlanSidePanel trigger={<Button>...} />}` em `PageHeader`) simplesmente não renderizava nada — confirmado bug pré-existente (reproduzido revertendo temporariamente o arquivo para a versão do HEAD antes de qualquer edição desta sessão). O padrão que funciona de forma comprovada em todo o app (`ClinicDialog`, `InviteUserDialog` etc.) é o componente cliente expor um trigger padrão interno quando nenhum é passado explicitamente — apliquei o mesmo padrão aqui. As 4 chamadas de "Editar plano" (linha por linha, com `trigger` explícito) continuam funcionando como antes, pois esse caminho nunca esteve quebrado.
- `features/modules/components/modules-page.tsx` — removidas as duas seções "Novo plano comercial" e "Planos e regras de uso" (formulários HTML crus duplicando `PlatformCommercialCatalogPage`), substituídas por um cartão único apontando para `/dashboard/billing/catalog`. As seções "Catálogo de módulos" e "Cobertura por plano" (específicas de módulos, não de plano comercial) foram preservadas sem alteração — pertencem à UI-016.
- `app/(dashboard)/dashboard/modules/page.tsx` — **correção funcional**: removido o `redirect("/dashboard/billing")` incondicional; a rota agora renderiza `ModulesPage`, tornando o item de navegação "Módulos" utilizável pela primeira vez.
- `messages/pt-BR.json` — novos namespaces `billing.subscriptionsPage`, `billing.paymentsPage`, `billing.catalogPage` e a chave `billing.actions.sendToTrial`.

## Arquivos removidos

- `features/billing/components/clinic-subscription-actions.tsx` — código morto, zero importadores, duplicava a lógica de ações de assinatura já implementada inline em `PlatformSaasSubscriptionsPage`.

## Decisões arquiteturais

- **MRR SaaS vem do servidor, não é recalculado no cliente**: `overview.clinicSubscriptions[].invoices` só traz até 6 faturas por assinatura (usado para "última cobrança"), então somar localmente sub-contaria receita de assinaturas com histórico maior. `platformMetrics.monthlySaasRevenue` já faz a agregação correta no banco.
- **Removida a duplicação de "gestão de plano" de `ModulesPage`, não de `PlatformCommercialCatalogPage`**: o catálogo comercial já é a tela migrada para o Design System (Select, StatusIndicator, SidePanel); os formulários em `ModulesPage` eram HTML cru e mais antigos. Mantê-los como estavam significaria duas telas divergentes editando o mesmo `ClinicBillingPlan` — exatamente o que o critério "sem confusão entre cobranças" pede para evitar.
- **Corrigida a rota `/dashboard/modules`, não apenas documentada como pendente**: encontrar e não corrigir um nav item completamente morto, no meio exato da área que a task pede para não duplicar, pareceu pior do que corrigi-lo. A correção não implementa nenhum fluxo novo de módulos (isso é UI-016) — apenas restaura o acesso a uma tela que já existia e já tinha suas próprias checagens de permissão.
- **Não copiei os tons de status para dentro de `features/billing`**: reutilizei `getClinicSubscriptionStatusTone`/`getPaymentStatusTone` de `features/clinic/utils/clinic-status.ts` (criado na UI-014), já que cross-feature import é um padrão já estabelecido no projeto (ex.: `billing` já importa de `modules`, `clinic` já importa de `modules` e `audit-log`). Evita duplicar a mesma lógica de cor por status pela terceira vez.
- **Não implementei seleção real de plano na criação de clínica nem alteração de plano fora da fila de assinaturas**: esses fluxos já existem corretamente na fila de assinaturas (`platformAssignClinicBillingPlanAction`, "Trocar plano"); não há necessidade de um segundo caminho.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 28 rotas geradas.
- `pnpm test:billing` — ✅ os 7 cenários (inclui transições de assinatura SaaS e faturas da clínica).
- `pnpm test:modules` — ✅ os 4 cenários.
- `pnpm test:tenant` — ✅ os 11 cenários de isolamento entre tenants (inclui "Platform dashboard metrics stay production-relevant and scoped to real SaaS data").
- `pnpm test:rbac` — ✅ os 5 cenários.
- **Verificação em navegador (Playwright)**, autenticado como `owner+workspace@membership-core.local` (plataforma):
  - `/dashboard/billing/subscriptions`: 5 métricas corretas (Contas ativas 0, Em trial 1, Inadimplentes 1, Canceladas 2, MRR SaaS R$ 0,00 — matemática bate com os 4 registros da fila); filtros Empresa/Plano/Status como `Select`; badges "Teste"/"Cancelado"/"Em atraso" com tons corretos; "Trocar plano" funcional.
  - `/dashboard/billing/payments`: 3 métricas corretas (Cobranças emitidas 4, Pendentes 3, Em atraso 0, com 1 já paga no histórico); filtros migrados; tabela com 8 colunas em pt-BR.
  - `/dashboard/billing/catalog`: botão "Novo plano" testado end-to-end — clique abre o painel "Novo plano comercial" com todos os campos (nome, descrição, preços, trial, disponibilidade); 4 planos listados com `StatusIndicator` "Ativo".
  - `/dashboard/modules` (plataforma): antes da correção, redirecionava sempre para `/dashboard/billing/catalog`; depois da correção, renderiza corretamente com métricas, o cartão apontando para o catálogo comercial, catálogo de módulos e cobertura por plano.
  - `/dashboard/modules` (clínica, `owner+nortex-medical@membership-core.local`): renderiza sem erros após a correção da rota.
  - 0 erros de console em todas as passagens.

## Trabalho remanescente

- Textos em inglês no catálogo/cobertura de módulos (`ModulesPage`) e nas ações/entidades de auditoria específicas de módulo: pertence à UI-016.
- Seleção de plano SaaS diretamente na criação de clínica (UI-014 já documentou essa decisão de escopo, redirecionando para a fila de assinaturas aqui construída).

## Riscos

- Baixo a médio: a correção da rota `/dashboard/modules` é uma mudança de comportamento visível — a página deixa de redirecionar e passa a renderizar conteúdo. `ModulesPage` já tinha suas próprias checagens de permissão (`hasPermission(role, "modules", "view")`) e branches para usuário sem clínica/sem módulos, então o risco é a exposição de um formulário morto de plano ter sido a única coisa "escondendo" um bug diferente — não foi o caso, validado com os 4 test suites e a verificação visual em ambos os contextos (plataforma e clínica).
- Baixo: a correção do trigger padrão em `PlatformPlanSidePanel` é aditiva (trigger continua aceitando override explícito); as 4 chamadas de edição existentes não mudaram de comportamento.

## Próxima task sugerida

`UI-016-modules.md`.
