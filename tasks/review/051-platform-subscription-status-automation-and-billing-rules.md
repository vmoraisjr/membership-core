# Task 051 - Platform Subscription Status Automation And Billing Rules

## Objetivo

Endurecer a automacao dos status SaaS e das regras de cobranca das clinicas.

---

## Escopo

### 1. Revisar automacao de status

Validar e corrigir a transicao entre:
- trial;
- active;
- past due;
- suspended;
- canceled;
- expired.

### 2. Revisar regras por evento e por leitura

Mapear o que hoje muda por:
- acao manual;
- leitura;
- pagamento;
- vencimento.

Corrigir inconsistencias entre essas fontes.

### 3. Definir estrategia minima de operacao

Se ainda nao houver job recorrente, documentar e implementar a estrategia
minima necessaria para o V1 comercial sem criar uma arquitetura excessiva.

---

## Fora de Escopo

- Integracao com gateway de pagamento.
- Motor financeiro complexo.

---

## Critérios de Aceite

- O status SaaS das clinicas deixa de depender de comportamento ambiguo.
- Vencimento e pagamento refletem corretamente no acesso operacional.
