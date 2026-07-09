# Task 046 - Messages Module Platform Clinic Inbox

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

Implementar a primeira superficie funcional do modulo de mensagens/chamados,
com caixa de entrada simples para plataforma e clinica e visualizacao por
thread.

---

## Contexto

Com a fundacao de dominio definida, o proximo passo e entregar um fluxo minimo
real de comunicacao:
- a clinica abre chamado;
- a plataforma responde;
- a plataforma tambem pode iniciar contato com a clinica;
- tudo fica agrupado por thread e tema.

---

## Escopo

### 1. Lista de threads

Criar listagem simples com:
- assunto;
- categoria;
- status;
- clinica relacionada, quando estiver na visao da plataforma;
- ultima atualizacao;
- indicador de mensagens nao lidas, se isso couber sem inflar escopo.

### 2. Criacao de thread

Permitir:
- clinica abrir chamado para a plataforma;
- plataforma abrir thread para uma clinica especifica.

Campos minimos:
- assunto;
- categoria;
- mensagem inicial.

### 3. Tela de conversa

Exibir historico da thread e permitir respostas sequenciais no mesmo tema.

### 4. Mudanca de status

Permitir acoes simples como:
- marcar em atendimento;
- aguardar retorno;
- resolver;
- fechar.

### 5. RBAC e isolamento

Garantir que:
- plataforma veja threads de todas as clinicas com controle global;
- clinica veja apenas as threads da propria clinica;
- perfis internos respeitem permissao de leitura/resposta conforme regra do
  modulo.

---

## Fora de Escopo

- Tempo real.
- Upload complexo de anexos.
- Regras avancadas de escalonamento.

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

Adicionar suite especifica do modulo, se criada.

---

## Testes Manuais Esperados

- [ ] A clinica consegue abrir chamado para a plataforma.
- [ ] A plataforma consegue abrir thread para uma clinica.
- [ ] As mensagens ficam agrupadas por tema/thread.
- [ ] A plataforma ve a clinica relacionada em sua caixa de entrada.
- [ ] Cada clinica ve apenas seus proprios chamados.

---

## Critérios de Aceite

- O produto passa a ter comunicacao basica funcional entre plataforma e
  clinicas.
- O fluxo se comporta como chamado simples, sem inflar para um hub complexo.
- O isolamento multitenant permanece preservado.
