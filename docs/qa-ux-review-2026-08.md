# QA/UX Review — Agosto 2026 — Relatório de Entendimento

## Status

Leitura e interpretação do `qa-ux review.pdf` anexado. Nenhum código foi
alterado por este documento — é a base para o backlog em
`tasks/backlog/UI-032` a `UI-046`.

## Diagnóstico geral

A revisão cobre 5 telas (login, recuperação de senha, visão geral,
empresas clientes, módulos) e para antes de terminar a navegação porque o
mesmo problema se repete em todas: **excesso de card, borda e espaço em
branco, fontes grandes demais, elementos "flutuantes" que chamam atenção
sem necessidade**. O Fase 2 do rebrand (UI-021 a UI-031) resolveu cor,
raio de modal, avatar e uma primeira redução de escala tipográfica — mas,
pelo relato, não foi longe o suficiente na densidade real da interface.
Isso é tratado como uma **segunda rodada de densidade**, não uma correção
pontual (ver UI-040).

Além disso, a revisão traz **bugs funcionais reais** (não só visuais):
cancelamento sem confirmação, erro de hidratação, catálogo com edição
travada, status de pagamento que deveria ser automático. Esses foram
separados dos itens visuais porque têm risco e critério de aceite
diferentes.

## Itens por tela

### 1–3. Login / Recuperação de senha / Loading

- **Formulário grande demais** — em notebooks/monitores menores força
  rolagem. Precisa reduzir formulário e fonte.
- **Linha visível no degradê** (recuperação de senha) — diagnostiquei a
  causa: o wash verde (`auth-card.tsx` e `login/page.tsx`) é uma
  `<div class="h-56 bg-[radial-gradient(...)]">` com altura fixa (224px).
  Em telas largas, o raio do gradiente `circle_at_top` (calculado a partir
  da distância até o canto mais distante) pode ser maior que 224px, então
  o degradê ainda não chegou a "transparent" quando a caixa termina — cria
  um corte reto exatamente na borda inferior da caixa. Correção correta:
  aplicar `mask-image: linear-gradient(to bottom, black, transparent)` na
  própria caixa do wash, garantindo transparência total na borda
  independente do cálculo do raio (ver UI-032).
- **Loading do login com logo azul e animação genérica** — confirmado em
  código: `features/auth/components/login-form.tsx:134-154` — overlay de
  tela cheia mostrado durante o submit, usa `SHEEP_SYMBOL_BLUE_PATH` (PNG
  azul) girando (`animate-spin`) sobre o próprio logo estático. Precisa
  trocar para o novo `SheepIcon` (verde, já criado na rodada anterior) e
  uma animação mais autoral que girar o logo cru (ver UI-032).

### 4. Visão geral (Controle global)

| # | Pedido | Observação |
|---|---|---|
| 4.1 | Botão de colapsar ainda sobreposto | Já corrigido em código numa rodada anterior (`z-30` no botão vs `z-20` do topbar, mais reestruturação do `h-screen` da sidebar). O PDF pode refletir uma versão anterior ao fix. **Precisa reconfirmar visualmente antes de fechar** — se persistir após o fix já aplicado, é uma regressão nova a investigar (UI-036). |
| 4.2 | "Boa noite, Owner" grande demais, não precisa ser card flutuante; remover "Ver contas em atraso" | Vira texto simples fora de card. Botão identificado em `dashboard-home-page.tsx` (`action=` do `PageHeader`, rótulo `dashboard.primaryAction.platform`) (UI-034). |
| 4.3 | Info duplicada (topo-direita e rodapé da sidebar) | Confirmado: `DashboardHeader` mostra usuário no topo, `SidebarNavContent` repete no rodapé (`sidebar-foot`). Consolidar num menu suspenso único no topo (usuário, versão do sistema, sair) e remover o bloco da sidebar (UI-034). |
| 4.4–4.5 | Panorama da plataforma alto demais; cards internos também altos; bordas dos cards das pontas encostam na borda da seção | Reduzir altura/padding de `.metric-tile` além do que a UI-030 já fez, e adicionar respiro (`padding`/`gap`) na grade para não encostar na borda do `SectionCard` (UI-035). |
| 4.6 | Manter "O que precisa de atenção hoje" | Sem ação — já está no formato aprovado (lista compacta da rodada anterior). |
| 4.7 | Remover "Atalhos da plataforma" | Seção inteira sai da tela (UI-035). |
| 4.8 | Remover "Cobertura por módulo" | Seção inteira sai da tela (UI-035). |

### 5. Empresas clientes

- **5.1** — No breadcrumb, o item atual ("Empresas") tem visual de botão
  (`rounded-full border bg-background`, `breadcrumb-trail.tsx`). Trocar
  para texto simples, sem chip — aplicar a todas as telas, já que o
  componente é compartilhado (UI-033).
- **5.2** — Botões de ação sem tooltip. Já existe `title=` em vários
  (o navegador mostra como tooltip nativo), mas o pedido é garantir que
  **todo** botão de ícone tenha isso de forma consistente — auditoria
  completa necessária (UI-037).
- **5.3** — "Visão rápida" (`ClinicQuickViewPanel`) está "sem vida":
  redesenhar como formulário pequeno, sem cards internos, botão "Abrir
  workspace completo" com a cor primária (hoje é outline) (UI-038).
- **5.4** — Workspace completo da empresa: mesmo problema geral (fontes
  grandes, cards grandes, muitos cards, bloco de identidade ocupando
  muito espaço). Pedido explícito de **redesenho de densidade** (UI-039).

## Diretriz geral (aplica-se a todas as telas)

Trecho literal, porque define o critério de aceite de várias tasks:
> "precisamos de uma interface fácil com botoes discretos, fontes
> pequenas, menus discretos, menos bordas arredondadas. todos os
> formulários estao exagerados."

Isso vira a **UI-040** — uma segunda rodada de densidade global, distinta
da UI-030 (que só mexeu na escala de fonte). Esta task cobre: raio de
borda menor em superfícies internas (não só modais), botões com estados
de hover mais discretos, redução geral do número de `Card`/`SectionCard`
por tela.

### Proposta de reestruturação de informação (precisa confirmação)

O usuário pede que o workspace da empresa una **assinatura**, **pagamento**
e **identidade** numa única "visão geral" com links discretos para as
seções de edição, em vez de abas/áreas dedicadas. Pede para manter
**usuários** e **módulos** separados, mas com mais função inline (editar,
criar, trocar senha, pesquisar, desabilitar direto na listagem; toggle de
ativar/desativar módulo direto na tela, sem ir a outra área). Auditoria
deve virar uma tabela simples com filtro por usuário e data.

**Isso é uma mudança de arquitetura de informação, não só visual** — vale
confirmar o escopo antes de eu tocar em navegação/abas (UI-039 documenta a
proposta, mas fica marcada como "precisa aprovação de escopo" antes de
começar a implementação).

## Bugs encontrados (funcionais, não só visuais)

1. **Catálogo comercial: só um item pode ser editado.** Não encontrei
   guarda de código óbvia ao inspecionar `platform-commercial-catalog-page.tsx`
   — precisa investigação ativa (reproduzir localmente), não é um ajuste
   visual (UI-044).
2. **Erro de hidratação ao clicar "Abrir catálogo" em Módulos.** O botão
   (`modules-page.tsx:182-188`) é um `<Button asChild variant="outline"><a href="...">`
   — o rastro do erro (`components/ui/button.tsx:58`) sugere mismatch
   servidor/cliente no `Slot` do Radix, mas não é conclusivo sem
   depuração ao vivo (UI-045).
3. **Cancelamento de assinatura SaaS sem confirmação.** Nas Assinaturas
   SaaS (`platform-saas-subscriptions-page.tsx`), as transições de status
   (`platformUpdateClinicSubscriptionStatusAction`) são `<form><Button
   type="submit">` direto, **sem** `ConfirmDialog` — diferente do padrão
   já usado em `subscription-row-actions.tsx` (assinaturas de clínica) e
   `clinic-row-actions.tsx`, que envolvem ações destrutivas em
   `ConfirmDialog`. Essa é a causa provável do cancelamento acidental
   relatado (UI-041).
4. **Rótulo "Enviar para trial" poco claro.** Ação existe
   (`billing.actions.sendToTrial`) mas não há explicação do que acontece
   — revisar copy (UI-042).
5. **Status de pagamento "atrasado" deveria ser automático por data**, não
   manual — precisa confirmar se já existe um job/cron ou se é
   calculado só na leitura, e corrigir se for manual (UI-043).
6. **Fluxo de troca de plano ruim** — hoje é um `<Select>` inline na
   linha da tabela que já dispara a troca. Pedido: mostrar o plano atual
   como texto (sem menu suspenso) + uma ação "Trocar plano" que abre um
   mini formulário (mesmo padrão do "ver detalhe") com a lista de planos
   e exige confirmação antes de aplicar (UI-042).

## Chamados

Pedido de reestruturação completa: lista de chamados priorizando abertos,
com filtros, e ao clicar abre uma conversa estilo chat (WhatsApp/Teams),
não o formulário atual (formulário de novo chamado + lista + painel de
conversa lado a lado, tudo em cards). **Isso é uma redesenho de fluxo, não
só densidade** — UI-046 documenta a proposta de estrutura, mas também
fica marcada como "precisa aprovação de escopo" antes de implementar,
dado o tamanho da mudança.

## Backlog gerado

`UI-032` a `UI-046`, em `tasks/backlog/`. Ordem sugerida em
`tasks/backlog/README-FRONTEND.md` (seção "Fase 3 — QA/UX Agosto 2026").
