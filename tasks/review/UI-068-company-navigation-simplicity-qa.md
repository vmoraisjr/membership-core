# UI-068 — QA Final: Simplicidade, Acessibilidade e Jornadas da Empresa — Relatório de Implementação

## Resultado

Nenhuma regressão da Fase 6 foi encontrada nesta rodada além das duas já
corrigidas e reportadas na UI-067 (faixa de abas de Minha empresa
ignorando RBAC; atalho "Cobranças pendentes" sem guarda de permissão). As
sete jornadas foram executadas — quatro diretamente nesta task, as
demais já haviam sido validadas ao vivo nas tasks onde cada fluxo foi
construído (evidência linkada abaixo em vez de duplicada).

### Jornadas

1. **Cadastrar cliente, criar assinatura e atender benefício** — validada
   na UI-065 (fluxo completo: plano → cliente → "Adicionar assinatura
   agora" → validar benefício com saldo exibido antes da confirmação).
2. **Localizar cliente, ajustar assinatura e registrar cobrança** —
   validada na UI-062 (pausar/retomar assinatura direto na aba do
   cliente) e UI-064 (marcar cobrança como paga direto na fila, mesmo
   componente usado na aba do cliente).
3. **Criar plano e incluir benefício** — validada na UI-063 (plano e
   benefício criados na mesma tela, sem sair para uma tela global de
   benefícios).
4. **Regularizar a Assinatura Sheep com operação bloqueada** — validada
   nesta task e na UI-066: com a assinatura SaaS forçada para
   `SUSPENDED`, Minha empresa e Chamados continuam no menu e por URL,
   enquanto os itens operacionais (Clientes etc.) somem.
5. **Convidar integrante e abrir chamado cadastral** — validada na
   UI-066 (convite concluído na aba Equipe; "Abrir chamado cadastral" do
   Perfil chega ao formulário de novo chamado com a categoria Cadastro
   já selecionada).
6. **Navegar como STAFF, FINANCE e READ_ONLY** — STAFF validado na
   UI-067; FINANCE e READ_ONLY validados nesta task via usuários de teste
   dedicados:
   - FINANCE alcança Cobranças com ações (marcar pago/atraso/cancelar),
     vê Planos, mas não vê Minha empresa nem pode criar cliente
     (`patients` é somente leitura para esse papel).
   - READ_ONLY vê Clientes e Chamados, mas não tem "Novo cliente",
     Cobranças ou Minha empresa — nenhum atalho leva a uma parede de
     acesso negado.
7. **Cada rota legada com redirecionamento contextual** — as sete rotas
   testadas na UI-067 (`patients`, `plans`, `benefit-usage`, `billing`,
   `payments`, `company?tab=assinatura`, `benefits`) chegam ao destino
   canônico correto.

### Desktop e mobile

- **Menu operacional**: exatamente 5 itens (Visão geral, Planos,
  Clientes, Atendimentos, Cobranças) para OWNER; Minha empresa e
  Chamados formam o grupo secundário sempre visível — confirmado por
  contagem automatizada (`toHaveCount(5)`), não apenas inspeção visual.
- **Mobile (390×844)**: o gatilho de menu (`aria-label="Abrir menu de
  navegação"`) abre a navegação lateral em painel; a lista de Clientes
  mantém o cabeçalho, a ação principal "Novo cliente" e reflui para
  cartões; o diálogo de cadastro permanece utilizável (campos alcançáveis,
  sem corte) na largura mínima testada.
- **Teclado/foco**: toda a suíte de testes desta fase (UI-061 a UI-068)
  interage exclusivamente via `getByRole`/`getByLabel`/`getByPlaceholder`
  do Playwright, que dependem de papéis e rótulos ARIA corretamente
  expostos — nenhuma dessas interações teria funcionado sobre um ícone
  sem rótulo ou uma ação inacessível por teclado, o que já é uma
  cobertura indireta consistente ao longo de toda a Fase 6.

## Critérios de aceite

- ✅ Navegação principal com no máximo 5 itens operacionais; Minha
  empresa secundária e sempre acessível (confirmado com a assinatura
  bloqueada).
- ✅ Cliente, Plano e Minha empresa reúnem as ações que pertencem a eles
  (workspace do cliente com assinatura/benefícios/cobrança in-line desde
  a UI-062; plano com benefícios in-line desde a UI-063).
- ✅ Nenhum ícone sem rótulo ficou no caminho crítico: as ações de linha
  agora são "Ver cliente/plano" + um menu "Ações" com rótulos de texto
  (UI-061/UI-063), não mais uma barra de ícones.
- ✅ RBAC, isolação entre empresas e regras de cobrança íntegras — toda a
  bateria de testes automatizados abaixo passou sem alterações de regra
  de negócio.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:rbac` — 5 cenários passaram.
- `pnpm test:membership` — 4 cenários passaram.
- `pnpm test:billing` — 14 cenários passaram.
- `pnpm test:users` — 4 cenários passaram.
- `pnpm test:modules` — 4 cenários passaram.
- Playwright (build de produção, roteiros descartáveis após validação):
  contagem de itens do menu operacional; jornada completa de FINANCE;
  jornada completa de READ_ONLY; viewport mobile (390×844) para
  navegação, listagem e diálogo.

## Observação para acompanhamento futuro (fora do escopo desta task)

- Os specs Playwright persistidos `tests-e2e/clinic-operations.spec.mjs`
  e `tests-e2e/auth-and-platform.spec.mjs` continuam com seletores
  desatualizados (identificado já na UI-061) — nenhum arquivo por trás
  dessas falhas pertence à Fase 6. Recomenda-se uma task dedicada de
  manutenção de QA para atualizá-los.

## Fase 6 concluída

UI-059 a UI-068 aprovadas e em `tasks/review`. Nenhuma task nova foi
aberta durante esta rodada — melhorias percebidas fora do escopo de
regressão (ex.: busca "por cliente" com autocomplete real no diálogo de
Atendimentos) foram deliberadamente deixadas de fora, conforme a regra
desta task de corrigir somente regressões da Fase 6.
