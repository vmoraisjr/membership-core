# Task 042 - Platform Clinic Detail Management Completion

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

Concluir a tela de detalhes da clinica para que o owner/admin da plataforma
consiga gerir a operacao de cada clinica a partir de um unico ponto.

---

## Contexto

A listagem global de clinicas ja esta mais proxima do esperado, mas o detalhe da
clinica precisa consolidar melhor as informacoes operacionais e administrativas.

Ao clicar na clinica, o owner da plataforma precisa encontrar rapidamente:
- dados da clinica;
- usuario master da clinica;
- assinatura/plano;
- pagamentos;
- historico administrativo relevante.

---

## Escopo

### 1. Consolidacao do cabecalho da clinica

Exibir de forma objetiva:
- nome;
- status;
- localizacao;
- plano ativo;
- situacao da assinatura da plataforma;
- proximos vencimentos principais.

### 2. Bloco do usuario master da clinica

Mostrar:
- nome;
- email;
- status;
- ultimo acesso, quando houver.

Permitir apenas as acoes coerentes com a regra atual:
- resetar senha;
- atualizar senha do master da clinica, se esse fluxo ja estiver previsto;
- sem abrir gerenciamento da equipe interna da clinica.

### 3. Bloco financeiro e de assinatura

Consolidar:
- plano/assinatura SaaS da clinica;
- status;
- vigencia;
- proximo pagamento;
- historico resumido de faturas/pagamentos.

### 4. Historico administrativo da clinica

Exibir eventos relevantes para suporte e governanca, como:
- criacao da clinica;
- alteracoes cadastrais;
- mudancas de plano;
- resets de senha do master;
- suspensoes/reativacoes.

### 5. Coerencia de navegacao

Garantir que esta tela seja um drill-down de plataforma:
- acessivel apenas por owner/admin global;
- sem virar uma imitacao da area interna da clinica;
- com links claros de volta para a listagem.

---

## Fora de Escopo

- Edicao da operacao diaria da clinica a partir dessa tela.
- Administracao dos usuarios internos da clinica.

---

## Validacoes Obrigatorias

Após implementacao, rodar:

```bash
pnpm test:billing
pnpm test:rbac
pnpm test:tenant
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] O detalhe da clinica mostra dados cadastrais e operacionais resumidos.
- [ ] O owner da plataforma consegue ver o master da clinica.
- [ ] Assinatura, pagamentos e vencimentos ficam visiveis no mesmo contexto.
- [ ] O owner da plataforma consegue executar as acoes administrativas previstas.
- [ ] O usuario de clinica nao acessa essa tela global.

---

## Critérios de Aceite

- O detalhe da clinica passa a servir de central administrativa por clinica.
- O owner/admin da plataforma ganha visibilidade suficiente para suporte e
  governanca.
- A tela reduz a necessidade de navegar por paginas desconexas.
