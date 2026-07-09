# Task 029 - Clinic Administration Macro Section

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

Criar a macro sessão `Administração` na visão da clínica, concentrando
informações institucionais e contratuais da própria clínica.

---

## Contexto

A clínica precisa acompanhar sua relação administrativa com a plataforma de
forma agrupada e previsível.

Isso inclui:
- plano contratado;
- pagamentos;
- vencimentos;
- vigência;
- demais abas administrativas correlatas.

Hoje essas informações estão dispersas ou misturadas com fluxos operacionais.

---

## Escopo

### 1. Macro sessão `Administração`

Criar uma macro sessão para a visão da clínica contendo abas ou subáreas como:
- dados da clínica;
- plano atual;
- pagamentos;
- vencimentos;
- vigência;
- contratos, se fizer sentido no agrupamento final.

### 2. Visão da clínica sobre seu próprio plano

A clínica deve conseguir visualizar:
- qual plano possui;
- status do plano;
- vigência;
- situação financeira;
- principais eventos administrativos relacionados.

Essa visão é de acompanhamento, não de administração global do plano.

### 3. Clareza de navegação

A macro sessão deve separar bem:
- o que é administração da clínica;
- o que é operação do dia a dia.

### 4. RBAC

Somente perfis apropriados da clínica devem acessar cada aba administrativa.

### 5. Integração com billing e contratos

Se billing e contratos já existirem como módulos independentes, reorganizar a
experiência para que a clínica os encontre dentro da macro sessão adequada,
sem quebrar a arquitetura existente.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:billing
pnpm test:contracts
pnpm test:rbac
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] A clínica encontra uma macro sessão `Administração`.
- [ ] Dentro dela, consegue acompanhar plano, pagamentos, vencimentos e vigência.
- [ ] A navegação administrativa fica distinta da navegação operacional.
- [ ] O acesso às abas respeita o RBAC da clínica.

---

## Critérios de Aceite

- A visão da clínica ganha uma área administrativa clara e agrupada.
- Plano, pagamentos e vigência deixam de ficar dispersos.

