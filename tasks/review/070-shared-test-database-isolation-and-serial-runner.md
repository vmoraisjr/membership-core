# Task 070 - Shared Test Database Isolation And Serial Runner

## Objetivo

Eliminar falsos negativos na bateria automatizada garantindo execucao confiavel
das suites que hoje compartilham o mesmo banco de teste.

---

## Escopo

### 1. Orquestracao

Definir um runner oficial para:
- execucao serial local;
- execucao consistente em CI;
- agrupamento das suites criticas.

### 2. Isolamento

Avaliar e implementar uma estrategia de isolamento, como:
- schema por suite;
- banco efemero por job;
- seed/cleanup mais robusto.

### 3. Validacao

Garantir que a bateria completa rode sem interferencia cruzada.

---

## Critérios de Aceite

- A suite completa roda sem falsos negativos por concorrencia.
- Existe um comando oficial para QA tecnica completa.
