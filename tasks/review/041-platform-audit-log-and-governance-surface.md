# Task 041 - Platform Audit Log and Governance Surface

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

Criar uma visao de auditoria global da plataforma, separada da auditoria da
clinica, com filtros e eventos relevantes para a operacao administrativa do
SaaS.

---

## Contexto

A auditoria atual esta desenhada para clinica:
- exige `clinicId`;
- filtra apenas entidades visiveis da clinica;
- nega o uso ao owner global.

O owner/admin da plataforma precisa acompanhar eventos administrativos da
plataforma e tambem eventos criticos relacionados as clinicas sob uma visao
global controlada.

---

## Escopo

### 1. Separacao entre auditoria global e auditoria da clinica

Garantir que existam regras claras para:
- auditoria global da plataforma;
- auditoria local da clinica.

Cada uma deve ter seu proprio filtro, mensagens e conjunto de eventos visiveis.

### 2. Eventos globais minimos

Exibir na auditoria da plataforma eventos como:
- login administrativo;
- criacao/edicao/desativacao de clinica;
- reset de senha do master da clinica;
- alteracoes de assinatura/plano da clinica;
- pagamentos e mudancas criticas de cobranca da plataforma;
- gestao de usuarios da plataforma.

### 3. Filtros e leitura

Permitir filtros simples, pelo menos por:
- ator;
- entidade;
- data;
- clinica, quando o evento estiver relacionado a uma clinica.

### 4. Restricao de acesso

Garantir que apenas owner/admin da plataforma acessem a auditoria global.

Preservar a auditoria local da clinica apenas para owner/admin da clinica.

### 5. Reuso sem duplicacao

Reaproveitar tabela, labels e componentes existentes sempre que possivel, sem
criar uma segunda implementacao paralela desnecessaria.

---

## Fora de Escopo

- Analytics historico avancado.
- Exportacao de auditoria.

---

## Validacoes Obrigatorias

Após implementacao, rodar:

```bash
pnpm test:audit
pnpm test:rbac
pnpm test:tenant
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] O owner da plataforma acessa a auditoria global sem exigir clinica.
- [ ] A auditoria global mostra eventos administrativos relevantes.
- [ ] E possivel filtrar por ator, entidade, data e clinica relacionada.
- [ ] A auditoria da clinica continua restrita ao contexto da propria clinica.
- [ ] Usuarios da clinica nao acessam a auditoria global.

---

## Critérios de Aceite

- A plataforma passa a ter trilha administrativa global confiavel.
- Auditoria global e auditoria de clinica deixam de se confundir.
- A governanca operacional do SaaS fica rastreavel.
