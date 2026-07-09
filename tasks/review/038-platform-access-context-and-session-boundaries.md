# Task 038 - Platform Access Context and Session Boundaries

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

Eliminar o vazamento de contexto entre plataforma e clinica, garantindo que o
owner/admin da plataforma sempre entre em um workspace global e que usuarios de
clinica sempre entrem no workspace da propria clinica.

---

## Contexto

Hoje parte da aplicacao ja diferencia plataforma e clinica, mas ainda existem
sinais misturados:
- o owner da plataforma pode cair em telas com expectativa de clinica;
- algumas rotas exibem navegacao global, mas a pagina ainda exige `clinicId`;
- a experiencia de sessao nao deixa claro quando o usuario esta em contexto de
  plataforma ou de clinica.

Essa task deve acertar a base de sessao e roteamento antes das demais.

---

## Escopo

### 1. Determinacao explicita do workspace ativo

Garantir uma regra unica e previsivel para distinguir:
- usuario global da plataforma;
- usuario vinculado a clinica;
- owner/master da clinica;
- administradores e operadores da clinica.

Revisar:
- leitura da sessao autenticada;
- resolvedor do usuario atual;
- helpers que derivam `clinicId`;
- guardas usados no layout do dashboard.

### 2. Entrada correta apos login

Garantir que:
- owner/admin da plataforma sejam redirecionados para a home global da
  plataforma;
- usuarios da clinica sejam redirecionados para a home operacional da clinica;
- first access e troca obrigatoria de senha preservem o contexto correto.

### 3. Persistencia correta sem "voltar no tempo"

Revisar o comportamento apos reinicio da aplicacao para evitar:
- sessao cair novamente em fluxo de first access sem motivo;
- perda indevida do contexto de plataforma;
- bootstrap ou seeds sobrescrevendo estado funcional.

### 4. Guard rails de acesso cruzado

Garantir que:
- paginas globais nao assumam `clinicId`;
- paginas de clinica nao sejam acessiveis por usuario global sem drill-down
  explicito;
- mensagens e empty states indiquem o contexto certo.

### 5. Testes de regressao

Cobrir pelo menos:
- login de owner da plataforma;
- login de owner de clinica;
- troca obrigatoria de senha no primeiro acesso;
- reinicio da aplicacao sem regressao de contexto;
- negacao de acesso cruzado entre workspaces.

---

## Fora de Escopo

- Reestruturacao visual completa da navegacao.
- Novo modulo de mensagens.

---

## Validacoes Obrigatorias

Após implementacao, rodar:

```bash
pnpm test:tenant
pnpm test:rbac
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] O owner da plataforma entra na visao global sem dados de clinica misturados.
- [ ] O owner da clinica entra na visao da propria clinica.
- [ ] O fluxo de first access nao reaparece indevidamente apos reinicio.
- [ ] O refresh da aplicacao preserva o contexto correto do usuario.
- [ ] Rotas globais e rotas de clinica bloqueiam acessos cruzados.

---

## Critérios de Aceite

- O contexto ativo deixa de oscilar entre plataforma e clinica.
- O login passa a abrir a superficie correta para cada tipo de usuario.
- A base de sessao fica confiavel para as tasks seguintes.
