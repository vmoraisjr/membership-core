# Task 050 - Platform SaaS Plan Catalog And Lifecycle Admin

## Objetivo

Transformar a administracao dos planos SaaS em uma superficie pequena,
comercial e utilizavel pelo owner da plataforma.

---

## Escopo

### 1. Catalogo de planos SaaS

Permitir ao owner global:
- cadastrar plano SaaS;
- editar nome, preco, recorrencia e regras basicas;
- ativar e desativar plano;
- evitar que planos inativos sejam aplicados por engano.

### 2. Vinculo de plano com clinica

Padronizar o fluxo para:
- aplicar plano a uma clinica;
- trocar plano;
- suspender;
- cancelar;
- reativar.

### 3. Simplificar o legado de modulos

Manter `modules` fora da navegacao principal enquanto nao houver valor
operacional real, migrando o que for necessario para uma linguagem direta de
planos SaaS.

---

## Fora de Escopo

- Marketplace de modulos.
- Billing self-service com gateway externo.

---

## Critérios de Aceite

- O owner global consegue gerir planos SaaS sem depender de superficies
  experimentais.
- O catalogo comercial fica simples e coerente com o restante da plataforma.
