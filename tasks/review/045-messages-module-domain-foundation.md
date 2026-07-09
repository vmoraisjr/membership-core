# Task 045 - Messages Module Domain Foundation

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

Definir a fundacao do modulo de mensagens/chamados entre plataforma e clinicas,
com escopo simples, rastreavel e compativel com o modelo multitenant.

---

## Contexto

O produto atual marcava comunicacao como fora do V1, mas agora ha uma
necessidade operacional concreta:
- abrir chamados;
- trocar mensagens por tema;
- tratar problemas, solicitacoes e pagamentos entre plataforma e clinicas.

Para nao criar um modulo grande demais, a fundacao deve ser pequena e orientada
a threads.

---

## Escopo

### 1. Modelo de dominio minimo

Definir entidades e relacionamentos para:
- thread/chamado;
- mensagem;
- participantes;
- status;
- tema/categoria.

### 2. Regras de contexto e isolamento

Definir claramente:
- quais threads sao plataforma <-> clinica;
- quem pode criar thread em cada lado;
- quem pode responder;
- como o `clinicId` participa do isolamento;
- como evitar que uma clinica veja thread de outra.

### 3. Status e categorias simples

Comecar com estados minimos, por exemplo:
- aberto;
- em atendimento;
- aguardando retorno;
- resolvido;
- fechado.

E categorias simples, por exemplo:
- problema;
- solicitacao;
- pagamento;
- cadastro;
- outro.

### 4. Auditoria e notificacao minima

Definir o que sera auditado na V1.1 do modulo:
- abertura do chamado;
- mudanca de status;
- nova resposta.

Se notificacao ainda nao existir, registrar isso como dependencia futura sem
bloquear a fundacao.

### 5. Planejamento tecnico incremental

Mapear:
- schema Prisma;
- services;
- actions;
- pages;
- requisitos de seeds e testes.

---

## Fora de Escopo

- Chat em tempo real.
- Email, WhatsApp ou omnichannel.
- SLA complexo e automacoes avancadas.

---

## Validacoes Obrigatorias

Após implementacao, rodar:

```bash
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

Se houver testes nesta fundacao, incluir:

```bash
pnpm test:tenant
pnpm test:rbac
```

---

## Testes Manuais Esperados

- [ ] O modelo de dados contempla thread, mensagem, status e categoria.
- [ ] A regra de isolamento por clinica fica definida e verificavel.
- [ ] O escopo do modulo permanece simples e operacional.
- [ ] A fundacao nao mistura comunicacao com CRM ou inbox geral.

---

## Critérios de Aceite

- O modulo de mensagens passa a ter fundacao de dominio clara.
- O escopo fica pequeno o suficiente para implementacao incremental.
- Tenant isolation e governanca ficam previstos desde a base.
