# Task 044 - Family Plan Billing Guardrails and Regression QA

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

Validar e endurecer o comportamento do plano familia para garantir que
dependentes nao gerem cobranca indevida e que a UI reflita corretamente a
heranca do titular.

---

## Contexto

A base atual ja indica que:
- apenas titular recebe assinatura direta;
- dependente herda a assinatura do titular;
- a cobranca e emitida para o titular.

Mesmo assim, ainda precisamos transformar isso em regra auditada e protegida
contra regressao, principalmente em fluxos de troca de responsavel, remocao de
dependencia e telas de consulta.

---

## Escopo

### 1. Auditoria funcional do fluxo familiar

Revisar ponta a ponta:
- criacao de titular;
- criacao de dependente;
- atribuicao de assinatura ao titular;
- exibicao da assinatura no dependente;
- geracao de cobranca;
- listagens e detalhes financeiros.

### 2. Garantias anti-cobranca duplicada

Verificar e reforcar para que:
- dependente nao gere invoice propria por engano;
- renovacao nao duplique cobranca em dependentes;
- reativacao/alteracao de status nao abra novo ciclo indevido para dependente.

### 3. Casos de borda

Cobrir pelo menos:
- remocao do vinculo de dependencia;
- troca de titular/responsavel;
- titular inativo;
- cancelamento da assinatura do titular;
- dependente menor reativado com novo titular.

### 4. Clareza na UI

Garantir que telas de paciente, assinatura e pagamento deixem claro quando:
- o plano e herdado do titular;
- a cobranca pertence ao titular;
- o dependente nao possui cobranca propria.

### 5. Testes automatizados e QA manual

Expandir a cobertura com cenarios familiares e montar checklist manual
especifico para nao haver duvida sobre cobranca.

---

## Fora de Escopo

- Politicas comerciais complexas de desconto familiar.
- Precificacao diferenciada por faixa de dependentes.

---

## Validacoes Obrigatorias

Após implementacao, rodar:

```bash
pnpm test:membership
pnpm test:billing
pnpm test:tenant
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] O titular recebe a assinatura e a cobranca.
- [ ] O dependente herda plano, status e vigencia sem gerar cobranca propria.
- [ ] A renovacao nao cria cobranca duplicada para dependente.
- [ ] A remocao ou troca de titular nao deixa dados financeiros inconsistentes.
- [ ] A UI explicita de quem e a cobranca em cenarios familiares.

---

## Critérios de Aceite

- O plano familia fica protegido contra cobranca indevida de dependentes.
- A regra de heranca passa a ser verificavel por testes e QA.
- A leitura operacional do caso familiar fica mais clara.
