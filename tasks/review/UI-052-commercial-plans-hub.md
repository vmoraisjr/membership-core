# UI-052 — Hub de Planos Comerciais — Relatório de Implementação

## Objetivo

Concentrar em Planos comerciais tudo que define a oferta SaaS: cadastro,
edição, módulos que cada plano libera, e descoberta de quais empresas
usam um plano — sem criar uma lista paralela às Empresas.

## Contexto herdado da UI-049

O adaptador `/dashboard/planos-comerciais` com abas **Planos**/**Módulos
incluídos** já existia desde a UI-049 (fundação de rotas). Esta task
evolui o CONTEÚDO das duas abas e adiciona a ação de descoberta —
cadastro/edição/ativação em si já era gerido por
`PlatformCommercialCatalogPage`, sem mudança de comportamento aqui.

## Arquivos modificados

- `features/billing/components/platform-commercial-catalog-page.tsx`:
  - Descrição do cabeçalho ganhou uma frase esclarecendo a distinção
    "Plano comercial Sheep" (oferta que a plataforma vende para a
    empresa) vs. "plano de benefícios" (o que a empresa configura para
    os próprios pacientes) — via `messages/pt-BR.json`.
  - Cada card de plano ganhou a linha "Módulos inclusos: Membership" —
    referência somativa aos módulos V1-ativos (`V1_ACTIVE_MODULE_KEYS`/
    `getModuleKeyLabel`, já usados pela política de módulos). **Decisão
    de design**: não criei um seletor de módulos por plano, porque o
    schema não tem (e a task explicitamente não pede) uma relação real
    `ClinicBillingPlan` ↔ `Module` — hoje módulos são habilitados por
    clínica, não por plano comercial, e a V1 só tem um módulo ativo de
    qualquer forma. Um seletor editável criaria a aparência de uma regra
    de negócio que não existe (contrariando "fora de escopo: habilitar
    módulos futuros" e o princípio de não deixar implementação
    pela metade).
  - Novo botão "Ver empresas neste plano" por card, linkando para
    `empresasUrl({ planId: plan.id })` (helper já existente desde a
    UI-049).
- `features/clinic/services/get-clinics.ts` — nova função
  `getClinicBillingPlanOptions()` (lista `{id, name}` de todos os planos
  comerciais, não só os com assinatura ativa).
- `features/clinic/components/clinic-page.tsx` — busca
  `getClinicBillingPlanOptions()` em paralelo com `getClinics()`; repassa
  `plans` e `initialPlanId` (lido de `?planId=` na rota) para
  `ClinicTable`.
- `app/(dashboard)/dashboard/empresas/page.tsx` — passou a ler
  `searchParams.planId` e repassar para `ClinicPage`.
- `features/clinic/components/clinic-table.tsx`:
  - Filtro de plano trocou de comparação por **nome** (string, arriscado
    a colisão) para comparação por **ID** — mais robusto.
  - `planOptions` agora vem da lista completa de planos comerciais (prop
    `plans`), não mais derivada só dos clientes já filtrados — assim um
    plano com zero assinaturas também aparece corretamente selecionado
    no dropdown ao chegar via "Ver empresas neste plano" (bug real
    encontrado e corrigido durante a verificação ao vivo — ver abaixo).

## Bug real encontrado e corrigido durante a verificação

Reproduzindo o clique em "Ver empresas neste plano" para um plano com
**zero** clientes vinculados, o dropdown "Filtro de plano" caía de volta
para "Todos os planos" (o `<select>` não tem `<option>` para um valor sem
correspondência) — o filtro por ID continuava aplicado corretamente por
baixo (0 resultados, resposta correta), mas a interface não deixava claro
que um filtro estava ativo. Corrigido alimentando o dropdown com a lista
completa de planos comerciais (`getClinicBillingPlanOptions`) em vez de
só os planos que já têm alguma empresa — agora todo plano aparece
nomeado no filtro, com ou sem assinaturas.

## Fora do escopo (não alterado)

- Planos locais, benefícios, pacientes ou assinaturas de paciente de uma
  empresa.
- Regras de precificação/cobrança.
- Habilitar módulos futuros ou criar relação real plano↔módulo no schema.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:billing` — ✅ 7 cenários.
- `pnpm test:modules` — ✅ 4 cenários.
- `pnpm test:tenant` — ✅ 11 cenários.
- Verificação end-to-end com Playwright (login real, build de produção):
  - Card de plano com 0 assinaturas → "Ver empresas neste plano" →
    filtro pré-selecionado corretamente nomeado, 0 resultados (correto).
  - Card de plano com 3 assinaturas ("plano start") → mesmo fluxo →
    filtro pré-selecionado, as 3 empresas certas listadas
    (Browser Created, PRISCILA NEGRAO S.A., First Access Co.) — confirma
    o critério de aceite "descobrir quais empresas usam um plano sem
    buscar em Assinaturas SaaS".
  - Texto de distinção Sheep/benefícios e "Módulos inclusos: Membership"
    visíveis em todos os 4 cards.
  - Botão "Editar plano" continua abrindo o painel de edição normalmente.

## Critérios de aceite

- ✅ Cadastro/edição/ativação da oferta SaaS acontece só em Planos
  comerciais (nenhuma tela paralela criada).
- ✅ Módulos globais não têm item próprio na navegação owner (já
  resolvido na UI-051; aqui só o conteúdo da aba "Módulos incluídos"
  reaproveita o `ModulesPage` existente).
- ✅ Owner descobre quais empresas usam um plano sem visitar Assinaturas
  SaaS — testado ao vivo.

## Riscos

- Baixo: a troca do filtro de plano de nome→ID em `ClinicTable` é
  estritamente mais correta (evita colisão de nomes) e só tem um
  consumidor (a própria tabela); nenhum outro componente lia
  `planFilter`.

## Próxima task

`UI-053-company-workspace-billing-consolidation.md` — seguindo em
sequência.
