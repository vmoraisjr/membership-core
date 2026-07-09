# Task 047 - Platform Functional QA Sweep

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

Executar uma rodada final de QA funcional sobre a separacao entre plataforma e
clinica, cobrindo navegacao, RBAC, assinaturas, cobrancas e o fluxo familiar.

---

## Contexto

Depois das tasks estruturais e do endurecimento do modelo familiar, precisamos
de uma verificacao transversal para garantir que a plataforma esteja funcional
tanto para o owner global quanto para as clinicas.

Essa task deve consolidar os cenarios manuais e automatizados mais importantes.

---

## Escopo

### 1. Matriz de acessos

Validar pelo menos:
- owner da plataforma;
- admin da plataforma;
- owner da clinica;
- admin da clinica;
- finance da clinica;
- staff da clinica.

### 2. Jornadas principais da plataforma

Cobrir:
- login;
- dashboard global;
- listagem e detalhe de clinicas;
- usuarios da plataforma;
- auditoria global;
- assinaturas e pagamentos das clinicas.

### 3. Jornadas principais da clinica

Cobrir:
- login;
- dashboard da clinica;
- pacientes;
- planos;
- beneficios;
- assinaturas;
- uso de beneficios;
- pagamentos da clinica;
- auditoria local;
- usuarios locais.

### 4. Cenarios familiares

Validar:
- titular e dependente;
- heranca de plano;
- pagamento somente do titular;
- exibicao correta em listas e detalhes.

### 5. Ajustes de rota e regressao

Caso sejam encontrados pequenos ajustes de rota, labels, guards ou empty states
durante a execucao, corrigir dentro desta task sem abrir historias paralelas
para defeitos triviais.

---

## Fora de Escopo

- Novos modulos alem dos ja planejados.
- Refatoracoes grandes sem relacao direta com o QA.

---

## Validacoes Obrigatorias

Após implementacao, rodar:

```bash
pnpm test:tenant
pnpm test:rbac
pnpm test:billing
pnpm test:membership
pnpm test:audit
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] A plataforma opera sem misturar dados de clinica na visao global.
- [ ] Cada clinica opera apenas seu proprio workspace.
- [ ] A governanca de usuarios e auditoria funciona em ambos os contextos.
- [ ] O fluxo de assinatura e cobranca permanece consistente.
- [ ] O plano familia nao gera cobranca indevida de dependente.

---

## Critérios de Aceite

- A plataforma fica operacional para o owner global.
- As clinicas ficam operacionais para seus usuarios locais.
- Os principais riscos de regressao ficam cobertos por QA e testes.
