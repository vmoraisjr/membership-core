# Backlog: Platform Admin Experience Refactor

## Contexto

Estamos refatorando a visão Plataforma do Sheep para elevar a experiência de administração SaaS sem quebrar regras de negócio existentes.

As referências obrigatórias estão em:

- `/docs/design/01-brand.md`
- `/docs/design/02-design-principles.md`
- `/docs/design/03-design-tokens.md`
- `/docs/design/04-color-system.md`
- `/docs/design/05-typography.md`
- `/docs/design/06-spacing-radius-shadow.md`
- `/docs/design/07-layout-grid.md`
- `/docs/design/08-iconography.md`
- `/docs/design/09-motion.md`
- `/docs/design/10-buttons.md`
- `/docs/design/11-inputs.md`
- `/docs/design/12-forms.md`
- `/docs/design/13-cards.md`
- `/docs/design/14-tables.md`
- `/docs/design/15-side-panels.md`
- `/docs/design/16-feedback.md`
- `/docs/design/17-page-header.md`
- `/docs/design/18-navigation.md`
- `/docs/design/19-implementation-guide.md`

## Objetivo

Transformar a visão Plataforma em uma experiência SaaS premium, clara e orientada a decisão, reduzindo aparência de CRUD administrativo genérico.

## Regras obrigatórias

- [ ] Não quebrar funcionalidades existentes.
- [ ] Não alterar regras de negócio sem necessidade.
- [ ] Não remover validações existentes.
- [ ] Não criar estilos inline.
- [ ] Não usar cores fora dos tokens.
- [ ] Não criar componentes específicos demais quando puderem ser reutilizáveis.
- [ ] Usar apenas `lucide-react` para ícones.
- [ ] Não usar mascote/cartoon como marca principal.
- [ ] Preservar i18n pt-BR.
- [ ] Preservar responsividade.
- [ ] Todo novo padrão visual deve virar componente reutilizável.

## Decisão pendente

- [x] Reconciliar a arquitetura da sidebar da Plataforma.
Motivo: o material anexado pede múltiplas seções (`Controle global`, `Operação`, `Financeiro`, `Governança`), mas a decisão mais recente no workspace simplificou tudo para uma única seção `Operação`.

## Fase 01 — Fundação visual

### TASK 01 — Brand assets Sheep Concept 1

- [x] Adicionar assets em `/public/brand/sheep/`.
- [x] Atualizar sidebar, login e header para a nova marca.
- [x] Garantir símbolo isolado no modo recolhido.
Observação: nesta fase foi reutilizado o símbolo premium já existente no repo como base operacional do Concept 1.

### TASK 02 — Tipografia global

- [x] Aplicar fonte principal do Design System.
- [x] Remover aparência serifada dos títulos.
- [x] Ajustar escala tipográfica da Plataforma.

### TASK 03 — Tokens visuais da Plataforma

- [x] Normalizar background, surface, border e primary via tokens.
- [x] Padronizar radius de inputs, cards e panels.
- [x] Padronizar sombras discretas.

## Fase 02 — Shell e navegação

### TASK 04 — PlatformShell

- [x] Refatorar `PlatformShell`, `PlatformSidebar`, `PlatformTopbar` e `PlatformContent`.
- [x] Padronizar largura, padding e breadcrumb.

### TASK 05 — Sidebar da Plataforma

- [x] Redesenhar a sidebar usando Lucide, active state claro e comportamento recolhido consistente.
- [x] Aplicar a decisão final sobre estrutura de seções.

### TASK 06 — Topbar da Plataforma

- [x] Redesenhar topbar com breadcrumb discreto, contexto, conta do usuário, sair e badge Sheep SaaS.

## Fase 03 — Estrutura de páginas

### TASK 07 — PageHeader padrão

- [x] Aplicar `PageHeader` consistente nas páginas principais da Plataforma.
- [ ] Garantir um único CTA principal por tela.

### TASK 08 — Redução de containers

- [x] Revisar excesso de cards dentro de cards.
- [x] Priorizar `Toolbar`, `DataTableContainer`, `MetricCard` e `ActionCard`.

## Fase 04 — Dashboard da Plataforma

### TASK 09 — Dashboard orientado a decisão

- [x] Reestruturar home com `PageHeader`, `AttentionQueue`, métricas, atalhos e atividade recente.
- [x] Colocar prioridades antes de métricas.

### TASK 10 — Componentes de métricas

- [x] Criar ou consolidar `MetricCard`, `MetricGrid` e `MetricDelta`.

## Fase 05 — Empresas clientes

### TASK 11 — Listagem SaaS de empresas

- [x] Refatorar listagem para `DataTable` padrão com `Toolbar`, busca, filtros e ações menos ruidosas.

### TASK 12 — SidePanel de detalhe rápido

- [x] Abrir detalhe rápido da empresa em `SidePanel`.
- [x] Preservar lista visível ao comparar empresas.

### TASK 13 — Criação de empresa

- [x] Migrar criação para `SidePanel` no desktop e tela cheia no mobile.
- [x] Agrupar por `Identidade`, `Contato e localização`, `Plano inicial`, `Logo/identidade visual`.

### TASK 14 — Edição de empresa

- [x] Refatorar para modo leitura com edição por seção.
- [x] Separar credencial master de dados cadastrais.

### TASK 15 — Dialog destrutivo padronizado

- [x] Padronizar confirmação de desativação de empresa com `ConfirmDialog`.

### TASK 16 — CompanyWorkspace

- [x] Reestruturar detalhe da empresa em `CompanyWorkspace`.
- [x] Organizar por abas: `Visão geral`, `Assinatura SaaS`, `Pagamentos`, `Usuários`, `Auditoria`, `Identidade`.

## Fase 06 — Financeiro SaaS

### TASK 17 — Catálogo comercial

- [x] Separar listagem e criação/edição em painel dedicado.
- [x] Priorizar lista sobre formulário persistente.

### TASK 18 — Componente `PlanForm`

- [x] Consolidar criação e edição de planos em um único componente reutilizável.

### TASK 19 — Assinaturas SaaS

- [x] Transformar a tela em fila operacional com filtros, tabela limpa e `SidePanel` de detalhe.

### TASK 20 — Pagamentos SaaS

- [x] Criar `PaymentAttentionBar`.
- [x] Melhorar legibilidade e ações operacionais da tabela.

## Fase 07 — Governança da Plataforma

### TASK 21 — Usuários da Plataforma

- [x] Refatorar para `PageHeader`, métricas, toolbar, tabela e `SidePanel`.

### TASK 22 — Edição de usuário em `SidePanel`

- [x] Migrar edição para painel lateral com footer de ações e erros inline.

### TASK 23 — Auditoria global

- [x] Refatorar para tabela mais densa e legível.
- [x] Resumir detalhes na linha.
- [x] Abrir payload completo em `SidePanel`.
- [x] Preservar exportação CSV.

## Fase 08 — Feedback e formulários

### TASK 24 — Toasts

- [x] Padronizar linguagem de sucesso, erro e warning.

### TASK 25 — EmptyState

- [x] Garantir estados vazios acionáveis nas páginas da Plataforma.

### TASK 26 — Skeleton/loading

- [x] Substituir carregamentos genéricos por skeletons contextuais.

### TASK 27 — Máscaras e validações BR

- [x] Criar utilitários reutilizáveis para CNPJ, CEP, telefone e UF.

### TASK 28 — `FormSection`

- [x] Criar componente reutilizável para seções de formulário longas.

## Fase 09 — Refinamento visual e QA

### TASK 29 — Redução de azul excessivo

- [x] Aplicar proporção visual priorizando neutros.

### TASK 30 — Densidade e espaçamento

- [x] Revisar padding, gaps, alturas e largura máxima.

### TASK 31 — Revisão de ícones

- [x] Garantir consistência de Lucide e clareza nas ações críticas.

### TASK 32 — Checklist visual

- [x] Criar `/docs/design/platform-admin-checklist.md`.
- [x] Aplicar checklist nas telas refatoradas.

### TASK 33 — QA completo da visão Plataforma

- [ ] Validar `Login`.
- [ ] Validar `Visão geral`.
- [ ] Validar `Empresas clientes`.
- [ ] Validar `Criar empresa`.
- [ ] Validar `Editar empresa`.
- [ ] Validar `Detalhe da empresa`.
- [ ] Validar `Catálogo comercial`.
- [ ] Validar `Assinaturas SaaS`.
- [ ] Validar `Pagamentos SaaS`.
- [ ] Validar `Usuários da plataforma`.
- [ ] Validar `Editar usuário`.
- [ ] Validar `Auditoria global`.

## Ordem recomendada

1. TASK 01–03
2. TASK 04–08
3. TASK 09–10
4. TASK 11–16
5. TASK 17–20
6. TASK 21–23
7. TASK 24–28
8. TASK 29–33

## Definition of Done

- [ ] A visão Plataforma não parece mais um CRUD administrativo.
- [ ] A navegação é previsível.
- [ ] As telas principais usam `PageHeader`.
- [ ] Entidades abrem preferencialmente em `SidePanel`.
- [ ] O dashboard mostra prioridades antes de métricas.
- [ ] A marca correta do Sheep foi aplicada.
- [ ] A tipografia está limpa e moderna.
- [ ] Tabelas estão legíveis e orientadas a ação.
- [ ] Modais são usados apenas quando realmente necessários.
- [ ] Feedbacks são calmos e objetivos.
- [ ] As telas respeitam o Design System.
