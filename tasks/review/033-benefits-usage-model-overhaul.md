# Task 033 - Benefits Usage Model Overhaul

## Context Verification

If the current session already contains the project context, architecture,
roadmap and workflow instructions, do not reload the documentation.

Proceed directly to repository audit and task execution.

Only reload these documents when:
- Starting a new session
- Context has been lost
- A document was modified since the last review
- The task explicitly requires architectural review

Documents:
- docs/ai-context.md
- docs/architecture.md
- docs/roadmap.md
- docs/codex-workflow.md

## Objetivo

Reestruturar a modelagem e o controle de uso de benefícios para que todos os
tipos suportem política explícita de limite, além de concluir a tradução do
formulário de criação de benefício.

---

## Contexto

Hoje o controle de uso está concentrado no tipo `LIMITED`, o que não atende à
regra desejada.

Todos os benefícios precisam passar a suportar política de uso independente do
tipo comercial do benefício.

Também existe pendência de tradução no formulário `create benefit`.

---

## Escopo

### 1. Tradução do formulário de benefício

Traduzir completamente o formulário de criação/edição de benefício para pt-BR,
incluindo labels, descrições, mensagens de erro e estados vazios relacionados.

### 2. Novo modelo de política de uso

Substituir a dependência atual de limitação exclusiva por tipo e introduzir
política de uso para qualquer benefício, com as opções:

1. `Sem limite`
2. `Mensal`
3. `Por uso total`

Para `Mensal`:
- permitir informar quantidade de usos por mês.

Para `Por uso total`:
- permitir informar quantidade total de usos disponíveis.

### 3. Compatibilidade com tipos existentes

Os tipos de benefício continuam existindo para fins de negócio/comercial, mas
não podem mais ser o único gatilho de limitação operacional.

A task deve revisar:
- schema Prisma;
- schemas Zod;
- formulários;
- exibição na lista;
- ações de criação/edição.

### 4. Ajuste do motor de consumo

Atualizar o controle de uso para respeitar a nova política:
- bloquear consumo quando o limite aplicável for atingido;
- considerar janela mensal corretamente;
- considerar total acumulado quando o modo for `por uso total`;
- manter `sem limite` livre de bloqueios indevidos.

### 5. Migração e compatibilidade de dados

Definir estratégia para registros existentes:
- mapear benefícios antigos `LIMITED` para a nova estrutura;
- preservar comportamento operacional dos dados já criados;
- evitar inconsistências em consultas históricas.

### 6. Auditoria e testes

Registrar em audit log as mudanças relevantes de política de uso, quando já
existirem operações auditáveis compatíveis.

Criar ou atualizar testes cobrindo:
- criação;
- edição;
- consumo permitido;
- bloqueio por limite mensal;
- bloqueio por limite total.

---

## Fora de Escopo

- Criar novos tipos comerciais de benefício além dos atuais.
- Redefinir cobrança financeira de assinaturas.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:membership
pnpm test:users
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] O formulário de benefício está em pt-BR.
- [ ] Qualquer benefício permite escolher política de uso.
- [ ] É possível definir uso sem limite.
- [ ] É possível definir limite mensal com quantidade.
- [ ] É possível definir limite total por uso.
- [ ] O consumo respeita corretamente cada política.

---

## Critérios de Aceite

- A limitação de uso deixa de depender apenas do tipo `LIMITED`.
- O motor de consumo passa a refletir a política configurada.
- O formulário de benefício fica traduzido e coerente com a nova regra.
