# Task 036 - Clinic Administration Governance and User Management

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

Reforçar a governança administrativa da clínica, restringindo corretamente a
auditoria e substituindo o fluxo de convite por gestão direta de usuários.

---

## Contexto

Na administração da clínica:
- o registro de auditoria deve refletir somente ações da própria clínica;
- a visibilidade da auditoria deve ficar restrita a owner e administrador;
- a sessão de usuários precisa migrar de convites para criação direta.

---

## Escopo

### 1. Auditoria da clínica

Garantir que o registro de auditoria:
- contenha somente ações da clínica no contexto da clínica;
- não exponha eventos globais da plataforma para usuários da clínica;
- permaneça acessível apenas para `OWNER` ou `ADMIN`, conforme regra definida.

Revisar:
- query de listagem;
- filtros;
- guardas RBAC;
- navegação;
- empty states e mensagens de acesso negado.

### 2. Remoção do fluxo de convite na gestão da clínica

Na sessão de usuários da clínica:
- remover a ação principal de convite;
- remover dependências visuais do fluxo de convite, quando não forem mais
  necessárias para a clínica;
- preservar, se ainda existir, qualquer fluxo global que não pertença a essa
  visão.

### 3. Novo botão `Adicionar usuário`

Adicionar fluxo de criação direta de usuário da clínica com os campos:
- e-mail;
- nome;
- data de início;
- data de fim opcional;
- tipo/perfil do usuário.

Definir claramente:
- senha inicial;
- exigência de troca de senha no primeiro acesso, se aplicável;
- status inicial do usuário;
- comportamento quando já existir usuário com o mesmo e-mail.

### 4. Lista e ações de usuários

Na lista de usuários, manter ações claras para:
- editar usuário;
- resetar senha;
- desativar usuário.

Se já houver ações parcialmente implementadas, consolidar em um fluxo único e
coerente.

### 5. RBAC e isolamento

Garantir:
- owner/master da clínica não ganha acesso a usuários de outras clínicas;
- usuário master da plataforma continua sem administrar usuários internos da
  clínica além das exceções já definidas de senha do master da clínica;
- tenant isolation preservado em queries e mutations.

### 6. Auditoria e testes

Registrar em audit log:
- criação direta de usuário;
- edição;
- reset de senha;
- desativação.

Criar ou atualizar cobertura mínima correspondente.

---

## Fora de Escopo

- Gestão global de usuários de todas as clínicas pela plataforma.
- Regras avançadas de expiração automática de acesso além do necessário para os
  campos de vigência informados.

---

## Validações Obrigatórias

Após implementação, rodar:

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

- [ ] A auditoria da clínica mostra apenas ações da clínica.
- [ ] Apenas owner/admin conseguem acessar a auditoria.
- [ ] A sessão de usuários deixa de depender de convite.
- [ ] É possível adicionar usuário diretamente.
- [ ] A lista de usuários permite editar, resetar senha e desativar.

---

## Critérios de Aceite

- A auditoria da clínica fica devidamente restrita.
- O gerenciamento de usuários fica mais direto e administrativo.
- Tenant isolation e RBAC permanecem preservados.
