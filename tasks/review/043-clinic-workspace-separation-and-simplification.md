# Task 043 - Clinic Workspace Separation and Simplification

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

Concluir a separacao da area da clinica para que usuarios da clinica enxerguem
somente a operacao e a administracao da propria clinica, sem superficies
globais da plataforma.

---

## Contexto

Depois de organizar a plataforma, ainda e necessario garantir a outra metade da
regra: usuarios da clinica devem operar apenas o ambiente local da clinica.

Essa visao precisa privilegiar o dia a dia:
- planos;
- beneficios;
- assinaturas;
- uso de beneficios;
- pagamentos da clinica;
- administracao local.

---

## Escopo

### 1. Revisao final da navegacao de clinica

Garantir que a sidebar da clinica mostre somente modulos locais e em ordem
operacional coerente.

### 2. Exclusao de superficies globais

Remover da visao da clinica qualquer acesso ou atalho para:
- usuarios da plataforma;
- auditoria global;
- clinicas globais;
- assinatura global de outras clinicas;
- modulos internos da plataforma, quando nao fizer sentido local.

### 3. Coerencia entre operacao e administracao

Organizar melhor o que fica em:
- Operacao;
- Administracao.

Sem misturar pagamento da plataforma com cobranca dos pacientes.

### 4. Estados vazios e textos

Ajustar mensagens de acesso negado, empty states e descricoes para refletir o
contexto da clinica, evitando linguagem global.

### 5. Regressao de permissao

Garantir que owner/admin/staff/finance da clinica continuem vendo apenas o que
o papel permite dentro da propria clinica.

---

## Fora de Escopo

- Redesenho completo da UI da clinica.
- Novos recursos operacionais alem dos ja previstos no V1.

---

## Validacoes Obrigatorias

Após implementacao, rodar:

```bash
pnpm test:rbac
pnpm test:tenant
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] O owner da clinica enxerga apenas recursos da propria clinica.
- [ ] Os itens globais da plataforma nao aparecem para usuarios de clinica.
- [ ] Pagamentos de pacientes e administracao local ficam em secoes coerentes.
- [ ] Textos e mensagens nao confundem plataforma com clinica.
- [ ] Perfis da clinica continuam respeitando RBAC local.

---

## Critérios de Aceite

- A area da clinica deixa de exibir residuos da governanca global.
- O workspace da clinica fica mais claro e operacional.
- A experiencia de cada tipo de usuario passa a ter fronteiras visiveis.
