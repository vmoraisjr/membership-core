# Task 034 - Patient Registration and Dependency Foundation

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

Fortalecer o cadastro de pacientes com validações completas e criar a fundação
de titular/dependente, incluindo vínculo com responsável previamente cadastrado.

---

## Contexto

O formulário de paciente ainda não aplica o mesmo nível de validação e feedback
que já existe no cadastro de clínica.

Também passa a existir uma regra central de domínio:
- cliente só pode ser `titular` ou `dependente`;
- menor de idade ou dependente de grupo familiar deve apontar responsável já
  cadastrado.

Essa fundação precisa existir antes de propagar plano e cobrança para
dependentes.

---

## Escopo

### 1. Validações completas do formulário de paciente

O formulário de criação/edição de paciente deve:
- validar todos os campos obrigatórios;
- exibir mensagens claras por campo;
- seguir o mesmo padrão visual de feedback do formulário de clínica, quando
  possível.

Aplicar explicitamente:
- validação de CPF para paciente;
- validação dos demais dados cadastrais relevantes;
- coerência entre campos obrigatórios e opcionais.

### 2. Reforço da regra documental

Garantir e revisar:
- clínica: validação de CNPJ;
- paciente: validação de CPF.

Se a validação da clínica já existir, apenas auditar e corrigir eventuais
lacunas encontradas.

### 3. Modelo de titular e dependente

Introduzir no domínio a classificação:
- `Titular`
- `Dependente`

Cliente não pode pertencer a ambos os tipos simultaneamente.

### 4. Responsável previamente cadastrado

Para paciente menor de idade ou dependente:
- exigir documento do responsável;
- o responsável deve já existir no cadastro;
- ao preencher o documento, se encontrado, exibir automaticamente o nome do
  responsável.

Adicionar disclaimer abaixo do título do formulário informando que:
- se o cliente for menor de idade ou dependente, o responsável deve ser
  cadastrado antes.

### 5. Ação `Adicionar dependente`

Na lista de pacientes:
- adicionar ação `Adicionar dependente`;
- abrir o formulário com o responsável previamente selecionado;
- exibir documento e nome do responsável no contexto do cadastro.

### 6. Edição e remoção de dependência

Na edição do cliente dependente:
- permitir remover o vínculo de dependência;
- ao remover, permitir:
  - manter o cliente ativo como titular; ou
  - deixá-lo inativo, especialmente no caso de menor de idade.

Se a reativação depender de novo titular/responsável, o fluxo deve exigir essa
regularização com regras claras.

### 7. Listagem

Na lista de pacientes, exibir o tipo:
- `Titular`
- `Dependente`

---

## Fora de Escopo

- Replicar ainda o plano do titular para dependentes.
- Mudar a lógica financeira das assinaturas.

Esses pontos ficam para a task seguinte.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:users
pnpm test:tenant
pnpm test:membership
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] O formulário de paciente valida os campos obrigatórios.
- [ ] CPF inválido é bloqueado com mensagem clara.
- [ ] O formulário mostra disclaimer sobre responsável pré-cadastrado.
- [ ] É possível cadastrar dependente apontando documento de responsável já existente.
- [ ] Ao preencher o documento do responsável, o nome aparece quando encontrado.
- [ ] A lista de pacientes exibe `Titular` ou `Dependente`.
- [ ] Existe ação `Adicionar dependente` a partir da lista.
- [ ] É possível remover a dependência em edição conforme as regras.

---

## Critérios de Aceite

- O cadastro de paciente fica validado e confiável.
- O domínio de titular/dependente passa a existir formalmente.
- A fundação para responsabilidade familiar fica pronta para a propagação de
  plano e cobrança.
