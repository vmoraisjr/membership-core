# Task 027 - Platform Clinic Plan Governance

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

Implementar a governança de planos da plataforma para clínicas, garantindo que
o master da plataforma precise ativar um plano para liberar o acesso da clínica
aos módulos do sistema.

---

## Contexto

Hoje a clínica nasce com foundations e módulos habilitados de forma técnica.

O comportamento de negócio desejado é mais controlado:
- a clínica deve depender de um plano da plataforma;
- o plano deve ser administrado pelo master da plataforma;
- a ativação do plano deve governar o acesso aos módulos da clínica.

---

## Escopo

### 1. Modelo de plano da plataforma para clínica

Revisar e consolidar o modelo de billing/plano já existente para que ele
represente claramente:
- plano contratado pela clínica;
- status do plano;
- vigência;
- permissão de acesso aos módulos.

### 2. Ativação explícita pelo master da plataforma

Ao criar uma clínica:
- ela não deve sair operacionalmente liberada apenas por existir;
- o master da plataforma deve ativar um plano para a clínica;
- a ativação deve ser uma operação explícita e auditável.

### 3. Governança de módulos por plano

O acesso aos módulos da clínica deve depender do plano ativo.

Definir, no mínimo:
- quais módulos ficam liberados por plano;
- o que acontece quando não há plano ativo;
- o que acontece em suspensão, atraso ou cancelamento.

### 4. Administração global de planos de clínicas

Criar ou evoluir a área da plataforma para que o master possa:
- listar planos das clínicas;
- ativar plano;
- alterar plano;
- suspender/cancelar plano;
- acompanhar status e vigência.

### 5. RBAC e isolamento

Somente o master da plataforma deve administrar esses planos globais.

Usuários de clínica:
- não devem administrar o plano global da própria clínica;
- apenas visualizar o resultado contratado, conforme regras da task 029.

### 6. Auditoria e testes

Registrar e testar:
- ativação;
- troca de plano;
- suspensão;
- cancelamento;
- impacto no acesso aos módulos.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:billing
pnpm test:modules
pnpm test:tenant
pnpm test:rbac
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] Clínica nova não fica plenamente operacional sem plano ativado.
- [ ] Master da plataforma consegue ativar um plano para a clínica.
- [ ] A ativação libera os módulos previstos.
- [ ] Suspensão/cancelamento afeta o acesso aos módulos conforme regra.
- [ ] Usuário de clínica não administra o plano global da clínica.

---

## Critérios de Aceite

- O plano da clínica passa a ser uma entidade de governança real.
- O acesso aos módulos depende do plano ativado pela plataforma.
- A administração global dos planos fica restrita ao master da plataforma.

