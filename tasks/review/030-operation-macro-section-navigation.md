# Task 030 - Operation Macro Section Navigation

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

Reorganizar a navegação para que a macro sessão `Operação` componha os fluxos
operacionais da clínica, como clientes, planos e demais áreas do dia a dia.

---

## Contexto

Com a criação da macro sessão `Administração`, a navegação precisa refletir duas
camadas principais:

- `Administração`
- `Operação`

`Operação` deve agrupar o uso cotidiano do produto pela clínica.

---

## Escopo

### 1. Macro sessão `Operação`

Criar ou reorganizar a navegação para que `Operação` concentre, no mínimo:
- clientes/pacientes;
- planos;
- benefícios;
- assinaturas;
- uso de benefícios;
- demais fluxos operacionais relacionados.

### 2. Separação entre macro sessões

Definir claramente:
- quais itens pertencem a `Administração`;
- quais itens pertencem a `Operação`;
- quais itens permanecem globais da plataforma.

### 3. Sidebar e hierarquia de navegação

Atualizar a sidebar e as entradas do dashboard para refletir essa nova
hierarquia sem confundir o usuário.

### 4. Continuidade de rotas e arquitetura

Preservar, quando possível:
- rotas existentes;
- feature-first architecture;
- isolamento entre visão de plataforma e visão de clínica.

### 5. UX e estados vazios

Garantir que a mudança de navegação:
- não esconda módulos ativos indevidamente;
- não exponha módulos fora de escopo da V1;
- mantenha estados vazios e descrições coerentes.

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

- [ ] Existe macro sessão `Operação`.
- [ ] Clientes, planos e áreas correlatas aparecem dentro dela.
- [ ] `Administração` e `Operação` ficam claramente separadas.
- [ ] A navegação continua coerente para clínica e plataforma.

---

## Critérios de Aceite

- A navegação operacional fica agrupada de forma clara.
- A separação entre administração e operação melhora o entendimento do sistema.
- A V1 continua respeitando os módulos ativos e o RBAC.

