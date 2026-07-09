# Task 028 - Platform Master Payments for Clinic Plans

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

Criar a sessão de pagamentos master da plataforma para acompanhar os planos das
clínicas, seus status financeiros e vencimentos.

---

## Contexto

Já existe foundation de billing da plataforma, mas a necessidade agora é uma
sessão master mais clara para acompanhamento financeiro dos planos das clínicas.

Essa sessão deve ajudar o master da plataforma a operar o financeiro B2B da
plataforma, separado do financeiro interno de cada clínica.

---

## Escopo

### 1. Sessão master de pagamentos

Criar ou reorganizar a sessão global de pagamentos para que o master visualize:
- clínica;
- plano contratado;
- status do plano;
- status dos pagamentos;
- próximas cobranças;
- vencimentos;
- histórico financeiro relevante.

### 2. Visão focada em planos das clínicas

A tela deve ser orientada ao acompanhamento do relacionamento plataforma →
clínica, não ao faturamento de pacientes.

Deve ficar claro:
- o que é cobrança SaaS da clínica;
- o que é cobrança operacional interna da clínica;
- que essas visões pertencem a contextos diferentes.

### 3. Filtros e acompanhamento

Adicionar filtros úteis, como:
- status do plano;
- status do pagamento;
- vencimento próximo;
- inadimplência;
- clínica específica.

### 4. Ações administrativas

Quando aplicável, permitir ao master da plataforma:
- confirmar pagamento;
- marcar atraso;
- suspender por inadimplência;
- navegar para a clínica/plano relacionado.

### 5. Auditoria e testes

Cobrir ações financeiras globais e preservar tenant isolation.

---

## Validações Obrigatórias

Após implementação, rodar:

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

- [ ] O master vê uma sessão clara de pagamentos das clínicas.
- [ ] É possível identificar plano, status, vencimento e inadimplência por clínica.
- [ ] A visão não se confunde com o faturamento de pacientes.
- [ ] As ações administrativas globais funcionam conforme RBAC.

---

## Critérios de Aceite

- A plataforma passa a ter uma sessão financeira global para planos das clínicas.
- O acompanhamento do billing SaaS fica claro, filtrável e operacional.

