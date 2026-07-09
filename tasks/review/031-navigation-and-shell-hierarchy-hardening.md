# Task 031 - Navigation and Shell Hierarchy Hardening

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

Reorganizar a navegação principal para priorizar o uso operacional diário,
permitindo colapso das macro sessões e reposicionando corretamente as áreas de
pagamento e administração entre visão de clínica e visão de plataforma.

---

## Contexto

No uso diário da clínica, `Operação` precisa aparecer antes de
`Administração`, com menor ruído visual.

Além disso:
- as macro sessões devem poder colapsar/minimizar;
- `Pagamento` da clínica deve permanecer em `Operação` apenas para cobranças
  das assinaturas dos pacientes;
- o pagamento da assinatura da plataforma deve aparecer em `Módulos` na visão
  da clínica;
- a visão global do owner/administrador da plataforma precisa refletir essa
  mesma hierarquia operacional.

---

## Escopo

### 1. Ordem e colapso das macro sessões

Na navegação da clínica:
- `Operação` deve aparecer antes de `Administração`;
- ambas as macro sessões devem poder expandir e colapsar;
- o estado visual deve deixar claro qual sessão está ativa;
- as subseções devem ficar escondidas quando a macro sessão estiver colapsada.

### 2. Reorganização da navegação da clínica

Definir a árvore da clínica com o seguinte direcionamento:
- `Operação`:
  - pacientes/clientes;
  - planos;
  - benefícios;
  - assinaturas;
  - uso de benefícios;
  - pagamentos de assinaturas de pacientes;
- `Administração`:
  - clínica;
  - usuários;
  - auditoria;
  - demais áreas administrativas da clínica;
- `Módulos`:
  - assinatura da plataforma;
  - módulo contratado;
  - valor da assinatura;
  - status;
  - data de expiração;
  - próximo pagamento;
  - histórico de pagamento.

### 3. Reorganização da navegação da plataforma

Na visão do owner/administrador da plataforma, `Operação` deve incluir:
- pagamentos das assinaturas das clínicas;
- módulos e planos;
- assinaturas das clínicas;
- clínicas.

Preservar a separação entre visão global da plataforma e visão isolada da
clínica.

### 4. Continuidade de rotas e UX

- Reaproveitar rotas e páginas existentes sempre que possível.
- Não introduzir navegação paralela duplicada.
- Garantir que o shell continue funcional em desktop e mobile.
- Garantir que módulos fora do escopo V1 não reapareçam na navegação.

---

## Fora de Escopo

- Implementar nesta task novas regras de negócio de usuários.
- Implementar nesta task o novo domínio de dependentes.
- Reescrever integralmente dashboards já existentes.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:rbac
pnpm test:tenant
pnpm test:modules
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] `Operação` aparece antes de `Administração` na visão da clínica.
- [ ] As macro sessões podem expandir e colapsar.
- [ ] As subseções ficam ocultas quando a macro sessão está colapsada.
- [ ] `Pagamento` de pacientes fica em `Operação`.
- [ ] A assinatura da plataforma da clínica aparece em `Módulos`.
- [ ] A visão global da plataforma exibe subseções operacionais coerentes.

---

## Critérios de Aceite

- A navegação diária da clínica fica mais evidente.
- O shell passa a suportar colapso das macro sessões.
- A separação entre pagamentos de pacientes e assinatura da plataforma fica
  clara.
- A plataforma passa a ter hierarquia operacional consistente para gestão das
  clínicas.
