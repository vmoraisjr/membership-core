# Task 040 - Platform Users Management Simplification

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

Criar uma superficie simples e exclusiva para o gerenciamento de usuarios da
plataforma, sem misturar usuarios internos de clinicas.

---

## Contexto

A tela atual de usuarios esta toda modelada para clinica:
- exige `clinicId`;
- mostra resumo da clinica;
- gerencia equipe da clinica;
- nao atende o owner/admin da plataforma.

Para a gestao global, a UI precisa ser objetiva e focar apenas nos usuarios da
plataforma.

---

## Escopo

### 1. Superficie dedicada para usuarios da plataforma

Permitir ao owner/admin global visualizar e administrar apenas:
- owner da plataforma;
- administradores da plataforma;
- demais usuarios internos de plataforma, se existirem.

### 2. Simplificacao da UI

Manter apenas o necessario:
- lista;
- busca;
- perfil/tipo;
- status;
- ultimo acesso;
- acoes essenciais.

Evitar cards e filtros excessivos que confundam com o contexto de clinica.

### 3. Acoes minimas

Oferecer acoes coerentes para usuarios da plataforma:
- adicionar usuario da plataforma;
- editar dados basicos;
- ativar/desativar;
- resetar senha.

Definir claramente:
- quem pode criar novos admins;
- se owner pode editar outro owner/admin;
- como impedir auto-bloqueio indevido do unico owner.

### 4. Isolamento entre plataforma e clinica

Garantir que:
- usuarios da plataforma nao listem usuarios de clinicas nessa tela;
- owner da plataforma nao passe a administrar usuarios internos da clinica por
  engano;
- a excecao de reset do master da clinica continue apenas na tela de detalhes
  da clinica.

### 5. Auditoria e testes

Registrar em audit log global:
- criacao;
- edicao;
- reset de senha;
- ativacao/desativacao de usuario da plataforma.

Cobrir cenarios principais em testes.

---

## Fora de Escopo

- Gestao global da equipe interna de cada clinica nesta mesma tela.
- Convites complexos ou onboarding por email fora do fluxo minimo.

---

## Validacoes Obrigatorias

Após implementacao, rodar:

```bash
pnpm test:users
pnpm test:rbac
pnpm test:tenant
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] O owner da plataforma acessa uma tela de usuarios sem dependencia de clinica.
- [ ] A lista mostra somente usuarios da plataforma.
- [ ] As acoes de criar, editar, resetar senha e desativar funcionam.
- [ ] O owner da plataforma nao consegue administrar usuarios de clinica nessa tela.
- [ ] As operacoes ficam registradas na auditoria global.

---

## Critérios de Aceite

- A gestao de usuarios da plataforma fica clara e enxuta.
- A tela deixa de misturar equipe da clinica com equipe da plataforma.
- As regras de governanca global ficam mais seguras.
