# Task 049 - Platform Users And Credential Governance Hardening

## Objetivo

Concluir a governanca de usuarios da plataforma e das clinicas, com foco em
operacao simples e segura.

---

## Escopo

### 1. Usuarios da plataforma

Garantir que a tela da plataforma permita:
- adicionar usuario da plataforma;
- editar nome, papel e periodo de acesso;
- ativar e desativar usuario;
- resetar senha do usuario da plataforma.

### 2. Usuarios da clinica

Garantir que a tela da clinica permita:
- adicionar usuario local diretamente;
- editar usuario local;
- ativar e desativar usuario local;
- resetar senha do usuario local.

### 3. Remover fluxo legado de convite

Eliminar da UX ativa:
- convites;
- tokens de convite;
- listagens de convites pendentes;
- acoes que contradizem o fluxo novo de criacao direta de usuario.

---

## Fora de Escopo

- SSO.
- Convites por email com aceite externo.

---

## Critérios de Aceite

- A plataforma gere apenas usuarios da plataforma.
- Cada clinica gere apenas seus usuarios locais.
- O fluxo legado de convite deixa de confundir a operacao.
