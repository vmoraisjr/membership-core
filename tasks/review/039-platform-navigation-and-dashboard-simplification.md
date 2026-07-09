# Task 039 - Platform Navigation and Dashboard Simplification

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

Separar visualmente a navegacao da plataforma da navegacao da clinica,
simplificando a UI do owner da plataforma e ocultando a sessao de modulos
enquanto ela nao for funcional no fluxo real.

---

## Contexto

Hoje a sidebar e a dashboard global ainda misturam conceitos de operacao da
clinica com governanca da plataforma. Isso dificulta entender o que o owner da
plataforma realmente deve administrar.

Para a operacao atual, o owner da plataforma precisa ver somente o necessario:
- clinicas;
- assinaturas;
- pagamentos;
- auditoria da plataforma;
- usuarios da plataforma.

Modulos devem ficar fora da navegacao ativa por enquanto.

---

## Escopo

### 1. Menu global da plataforma

Reorganizar a navegacao do owner/admin da plataforma para exibir apenas:
- resumo global;
- clinicas;
- assinaturas;
- pagamentos;
- auditoria;
- usuarios da plataforma.

### 2. Ocultacao de modulos

Retirar `Modulos` da navegacao ativa do owner da plataforma enquanto o fluxo nao
estiver funcional e coerente.

Definir se a rota:
- fica inacessivel por navegacao, mas preservada;
- ou fica bloqueada com mensagem de indisponibilidade interna.

### 3. Dashboard global objetiva

A home global deve mostrar somente indicadores de plataforma, como:
- total de clinicas;
- clinicas ativas;
- cobrancas/plano em atencao;
- distribuicao basica de modulos/assinaturas, se ja houver dado confiavel.

Remover atalhos ou cards que sugiram operacao de clinica dentro da home global.

### 4. Titulos, descricoes e labels

Ajustar textos da UI para deixar claro quando a visao e:
- Plataforma;
- Clinica.

### 5. Regressao de navegacao

Garantir que a navegacao da clinica continue priorizando:
- operacao;
- administracao da clinica;
- pagamentos da propria clinica;
- sem itens globais da plataforma.

---

## Fora de Escopo

- Implementacao do modulo de mensagens.
- Criacao da superficie funcional definitiva de modulos.

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

- [ ] O owner da plataforma ve apenas as secoes globais necessarias.
- [ ] A sessao de modulos nao aparece no menu principal da plataforma.
- [ ] A dashboard da plataforma mostra apenas dados globais.
- [ ] O usuario de clinica nao enxerga itens globais da plataforma.
- [ ] A nomenclatura da UI deixa claro qual workspace esta ativo.

---

## Critérios de Aceite

- A navegacao da plataforma fica enxuta e coerente.
- A home global deixa de parecer uma dashboard de clinica.
- O menu reduz ruido e prepara o terreno para as paginas administrativas.
