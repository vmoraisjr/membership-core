# Task 032 - Readonly Forms Pattern Hardening

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

Aplicar o padrão de abertura em modo somente leitura aos formulários já
preenchidos do sistema e corrigir inconsistências visuais do fluxo de edição.

---

## Contexto

O formulário de edição da clínica já passou a trabalhar com ativação explícita
de edição, mas o padrão ainda não foi propagado para os demais formulários.

Também foi reportado um problema visual: o botão `Cancelar` do formulário da
clínica ficou fora dos limites do layout.

O produto precisa de um padrão consistente:
- visualizar primeiro;
- editar apenas por ação explícita;
- confirmar ou cancelar com segurança;
- sem regressões de layout.

---

## Escopo

### 1. Padrão reutilizável de formulário readonly/editável

Auditar os principais formulários de edição da V1 e padronizar o comportamento:
- quando o registro já existe, abrir inicialmente em modo somente leitura;
- exibir botão explícito para habilitar edição;
- exibir botão claro para confirmar alterações;
- exibir botão claro para cancelar e voltar ao estado anterior.

Aplicar o padrão prioritariamente nas áreas ativas da V1:
- clínica;
- pacientes;
- planos;
- benefícios;
- assinaturas;
- usuários, quando a task específica de usuários já permitir edição direta.

### 2. Correção de layout e limites visuais

- Corrigir o posicionamento do botão `Cancelar` do formulário da clínica;
- garantir que ações não saiam dos limites do container;
- validar responsividade mínima em breakpoints principais.

### 3. Regras de edição segura

- Cancelar não pode persistir mudanças parciais;
- sair do modo edição deve restaurar valores persistidos;
- evitar habilitar campos de forma implícita por foco acidental;
- preservar acessibilidade básica dos botões e estados desabilitados.

### 4. Reuso arquitetural

- Reaproveitar componentes, dialogs e padrões existentes;
- evitar duplicar formulários apenas para introduzir modo de leitura.

---

## Fora de Escopo

- Alterar regras de negócio de domínio.
- Criar um design system novo.
- Implementar autosave.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:users
pnpm test:membership
pnpm test:tenant
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] Formulários de registros existentes abrem em modo somente leitura.
- [ ] O usuário precisa acionar explicitamente a edição.
- [ ] Confirmar salva corretamente.
- [ ] Cancelar descarta a edição local.
- [ ] O botão `Cancelar` do formulário da clínica permanece dentro do layout.

---

## Critérios de Aceite

- O padrão readonly/editável fica consistente nas áreas ativas da V1.
- O fluxo de edição fica mais seguro.
- O bug visual do formulário da clínica deixa de existir.
