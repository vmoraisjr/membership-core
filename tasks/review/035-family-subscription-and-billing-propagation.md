# Task 035 - Family Subscription and Billing Propagation

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

Propagar plano, status e cobrança do titular para os dependentes, garantindo
consistência operacional e financeira no modelo familiar.

---

## Contexto

Após a fundação de `Titular` e `Dependente`, a assinatura precisa refletir a
regra de negócio familiar:
- o plano do titular deve persistir para os dependentes;
- a cobrança deve ocorrer apenas para o titular;
- status, pagamentos e datas relevantes devem repercutir nos dependentes.

---

## Escopo

### 1. Propagação de plano do titular

Ao existir vínculo familiar:
- o plano associado ao titular deve valer para os dependentes;
- dependente não deve manter plano divergente do titular no fluxo normal;
- a UI deve refletir claramente a origem do plano do dependente.

### 2. Status e vigência refletidos nos dependentes

Persistir e exibir para dependentes, a partir do titular:
- status da assinatura;
- status de pagamento relacionado;
- data de início;
- vencimento;
- expiração;
- demais datas operacionais relevantes do ciclo.

### 3. Cobrança apenas no titular

A lógica financeira deve garantir:
- faturamento da assinatura apenas para o titular;
- não geração duplicada de cobrança para dependentes;
- leitura coerente do estado financeiro na visão dos dependentes.

### 4. Consultas, tabelas e perfis

Atualizar listagens, telas de detalhe e serviços para:
- mostrar quando o dependente herda dados do titular;
- evitar edição indevida de informações derivadas;
- preservar isolamento por clínica.

### 5. Regras de consistência

Definir e implementar o que ocorre quando:
- o titular é inativado;
- o vínculo familiar é removido;
- há troca de titular/responsável;
- o titular fica inadimplente ou com assinatura cancelada.

### 6. Testes

Criar ou atualizar testes cobrindo:
- criação de vínculo titular/dependente;
- propagação de plano;
- ausência de cobrança duplicada;
- repercussão de status e datas nos dependentes.

---

## Fora de Escopo

- Políticas comerciais avançadas para múltiplos dependentes com preços
  diferenciados.
- Descontos familiares complexos.

---

## Validações Obrigatórias

Após implementação, rodar:

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

- [ ] O dependente herda o plano do titular.
- [ ] A cobrança é gerada apenas para o titular.
- [ ] Status e vigência aparecem corretamente para os dependentes.
- [ ] Não há faturas duplicadas para dependentes.
- [ ] Mudanças no status do titular repercutem nos dependentes conforme a regra.

---

## Critérios de Aceite

- O modelo familiar passa a ter assinatura operacional consistente.
- A cobrança não duplica entre titular e dependentes.
- Dependentes refletem corretamente o ciclo do titular.
