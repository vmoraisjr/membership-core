# Task 072 - Form Validation Surface And Field Error QA

## Objetivo

Garantir que os formularios centrais do produto respondam com mensagens de erro
coerentes, previsiveis e completas para entradas invalidas.

---

## Escopo

### 1. Formularios prioritarios

Cobrir:
- empresa;
- cliente/paciente;
- plano;
- beneficio;
- assinatura;
- usuarios;
- chamados.

### 2. Casos negativos

Validar:
- campos obrigatorios;
- formatos invalidos;
- dependencias entre campos;
- limites de tamanho;
- estados inconsistentes.

### 3. Superficie de erro

Conferir se as mensagens retornam no ponto certo e com texto compreensivel.

---

## Critérios de Aceite

- Os formularios centrais ficam cobertos por testes de erro por campo.
- Os cenarios invalidos deixam de depender apenas de QA manual.
