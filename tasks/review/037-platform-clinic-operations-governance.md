# Task 037 - Platform Clinic Operations Governance

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

Concluir a visão operacional do owner/administrador da plataforma para gestão
das clínicas, com foco em assinatura, pagamentos, módulos, planos e detalhes
operacionais por clínica.

---

## Contexto

Após a reorganização da navegação e da governança de clínica, a plataforma
precisa oferecer uma superfície global coerente para operar o negócio SaaS.

Essa visão deve permitir gerir:
- assinatura das clínicas;
- pagamentos das clínicas;
- módulos e planos;
- cadastro e operação das clínicas.

---

## Escopo

### 1. Subseção de pagamentos das clínicas

Na sessão `Operação` da plataforma, criar ou consolidar subseção de pagamentos
para gerir a assinatura das clínicas que usam a plataforma.

Incluir, no mínimo:
- status do pagamento;
- vencimento;
- histórico básico;
- ações compatíveis com o estágio atual do billing global.

### 2. Subseção de módulos e planos

Criar ou consolidar superfície para:
- gerir preços;
- gerir regras de uso;
- relacionar planos da plataforma aos módulos liberados.

Reaproveitar o que já foi implementado nas tasks de governança de plano, sem
duplicar cadastros paralelos.

### 3. Subseção de assinaturas das clínicas

Permitir administrar:
- assinatura ativa;
- troca de plano;
- suspensão;
- cancelamento;
- vigência e próximos eventos de cobrança.

### 4. Subseção de clínicas

Na listagem global de clínicas, exibir pelo menos:
- status;
- localização;
- plano;
- quantidade de pacientes;
- quantidade de planos.

Adicionar ação `Detalhes`.

### 5. Tela de detalhes operacionais da clínica

Ao clicar em `Detalhes`, exibir página/tela com histórico operacional da
clínica, incluindo quando disponível:
- assinaturas;
- pagamentos;
- reset de senhas do master da clínica;
- demais eventos administrativos relevantes.

Definir claramente o que é timeline, tabela ou blocos resumidos, evitando
duplicar áreas já existentes sem necessidade.

### 6. RBAC, isolamento e auditoria

Garantir que apenas owner/administrador da plataforma acessem essas superfícies
globais.

Registrar as operações globais críticas em audit log compatível com o contexto
de plataforma.

---

## Fora de Escopo

- CRM global da plataforma.
- Atendimento omnichannel.
- Analytics avançado fora das métricas já existentes.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:billing
pnpm test:modules
pnpm test:rbac
pnpm test:tenant
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] A plataforma possui subseção para pagamentos das clínicas.
- [ ] A plataforma possui subseção para módulos e planos.
- [ ] A plataforma possui subseção para assinaturas das clínicas.
- [ ] A listagem de clínicas mostra status, localização, plano, pacientes e planos.
- [ ] A ação `Detalhes` abre histórico operacional da clínica.

---

## Critérios de Aceite

- A plataforma passa a ter visão operacional global coerente.
- A gestão de clínicas, assinaturas e pagamentos fica centralizada.
- O detalhamento operacional da clínica apoia suporte e administração do SaaS.
