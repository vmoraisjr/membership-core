# Task 071 - Auth First Access And Password Reset E2E Hardening

## Objetivo

Cobrir ponta a ponta os fluxos mais sensiveis de autenticacao e recuperacao de
acesso.

---

## Escopo

### 1. Primeiro acesso

Validar:
- usuario master da empresa criado com senha temporaria;
- obrigatoriedade de troca no primeiro acesso;
- liberacao normal apos troca;
- persistencia correta entre reinicios.

### 2. Reset por token

Validar:
- emissao de token;
- uso unico;
- expiracao;
- rejeicao de token invalido;
- reautenticacao apos reset.

### 3. Casos negativos

Cobrir:
- credencial invalida;
- usuario inativo;
- janela de acesso futura/expirada;
- tentativa de burlar `next`.

---

## Critérios de Aceite

- Os fluxos de acesso mais criticos ficam protegidos por testes ponta a ponta.
- Os cenarios negativos impedem regressao silenciosa em auth.
