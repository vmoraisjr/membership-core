# Backlog: Billing UX, Navegação e Isolamento

## 1. Segurança e isolamento

- [x] Auditar a listagem e as ações de chamados por contexto de clínica/plataforma.
- [x] Adicionar regressão automatizada cobrindo duas clínicas distintas para impedir resposta em chamado de outra empresa.
- [x] Validar que a auditoria clínica continua sem expor ações da plataforma para outras empresas.

## 2. Navegação e arquitetura de telas

- [x] Mover o acesso principal de catálogo comercial, assinaturas SaaS e pagamentos SaaS para a sidebar.
- [x] Criar páginas dedicadas para:
  - `/dashboard/billing/catalog`
  - `/dashboard/billing/subscriptions`
  - `/dashboard/billing/payments`
- [x] Redirecionar a rota antiga `/dashboard/billing` para o catálogo comercial na visão da plataforma.

## 3. UX do catálogo comercial

- [x] Melhorar os rótulos e textos de apoio dos campos.
- [x] Tornar os preços mensal/anual mais claros.
- [x] Trocar a flag de ativo por um controle de disponibilidade comercial mais compreensível.
- [x] Adicionar filtro por texto e disponibilidade.

## 4. UX das assinaturas e pagamentos

- [x] Tornar as ações de assinaturas SaaS mais visuais com ícones.
- [x] Melhorar a ação de aplicar plano.
- [x] Criar filtros dedicados para assinaturas SaaS.
- [x] Tornar as ações de pagamentos mais intuitivas com ícones.
- [x] Criar filtros dedicados para pagamentos SaaS.
- [x] Aplicar o mesmo padrão de ícones nas ações operacionais de pagamentos da clínica.

## 5. Auditoria

- [x] Adicionar extração CSV na auditoria com preservação dos filtros ativos.

## 6. Validação

- [x] Executar `tsc --noEmit`.
- [x] Executar lint dos componentes alterados.
- [x] Executar regressão de chamados via `tsx tests/messages/support-workspace-regression.test.ts`.
- [ ] Validar manualmente os novos fluxos na interface da plataforma e da clínica.
