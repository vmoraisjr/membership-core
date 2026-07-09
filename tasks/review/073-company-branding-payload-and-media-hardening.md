# Task 073 - Company Branding Payload And Media Hardening

## Objetivo

Endurecer o fluxo de identidade visual da empresa contra cargas excessivas e
entradas malformadas.

---

## Escopo

### 1. Guardas de payload

Adicionar limites para:
- tamanho de `data URL`;
- dimensoes ou volume de imagem quando aplicavel;
- formatos aceitos.

### 2. Normalizacao

Padronizar:
- tratamento de strings vazias;
- limpeza de branding;
- comportamento ao remover logo.

### 3. Testes negativos

Cobrir:
- payload exagerado;
- mime inconsistente;
- valor externo nao permitido;
- limpeza segura do branding.

---

## Critérios de Aceite

- O branding da empresa deixa de aceitar cargas desnecessarias ou arriscadas.
- O comportamento de upload/remocao fica previsivel.
