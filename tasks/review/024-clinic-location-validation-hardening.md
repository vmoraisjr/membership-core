# Task 024 - Clinic Location Validation Hardening

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

Endurecer a validação de localização no cadastro de clínica para impedir combinações
inválidas de cidade e UF e alinhar o comportamento do formulário com a expectativa do usuário.

---

## Diagnóstico

No fluxo atual, o formulário de clínica valida apenas:

- cidade preenchida;
- UF preenchida;
- UF pertencente ao conjunto de estados brasileiros válidos.

Arquivos envolvidos:
- `apps/web/features/clinic/schemas/clinic.schema.ts`
- `apps/web/features/clinic/services/clinic-formats.ts`
- `apps/web/features/clinic/components/clinic-dialog.tsx`
- `apps/web/features/clinic/actions/create-clinic.ts`
- `apps/web/features/clinic/actions/update-clinic.ts`

Hoje não existe nenhuma validação de correspondência entre cidade e estado.

Consequência:
- pares como `cidade = Sao Paulo` e `estado = RJ` passam no schema;
- o usuário percebe o formulário como inconsistente, porque visualmente existem os dois campos
  de localização, mas o sistema aceita combinações incompatíveis.

---

## Escopo

### 1. Definir a regra de negócio da validação

Implementar validação explícita para o par `cidade + UF`.

Modelo esperado para V1:
- cidade obrigatória;
- UF obrigatória;
- UF deve ser válida;
- cidade deve pertencer à UF selecionada.

Se a equipe decidir não carregar a malha completa de municípios nesta etapa,
deve haver no mínimo uma decisão explícita e documentada.
Mas a direção preferencial desta task é implementar a validação real.

### 2. Escolher estratégia técnica sustentável

Avaliar uma destas abordagens:

- dataset local de municípios/UFs;
- mapa reduzido confiável usado no backend;
- campo de cidade dependente da UF;
- autocomplete/combobox derivado de dataset local.

Evitar solução apenas cosmética.

### 3. Validar no client e no server

Garantir consistência nas duas camadas:
- feedback imediato no formulário;
- bloqueio definitivo no schema/action do servidor.

### 4. Mensagens de erro claras

Exemplos esperados:
- `Selecione uma cidade compatível com a UF informada.`
- `Informe uma UF brasileira válida.`

### 5. Cobertura de testes

Adicionar ou atualizar testes para:
- aceitar combinações válidas;
- rejeitar combinações inválidas;
- manter create/update alinhados com a mesma regra.

---

## Fora de Escopo

- Integração externa com IBGE ou APIs online.
- Geocodificação.
- Normalização completa de endereço.
- Busca por CEP com preenchimento automático.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

Se houver suíte específica de clínica ou tenant impactada, executá-la também.

---

## Testes Manuais Esperados

- [ ] UF inválida continua sendo bloqueada.
- [ ] Cidade vazia continua sendo bloqueada.
- [ ] Cidade incompatível com a UF é bloqueada.
- [ ] Cidade compatível com a UF permite salvar.
- [ ] A mesma validação vale para criação e edição de clínica.

---

## Critérios de Aceite

- O formulário não aceita mais combinações inválidas de cidade e UF.
- O backend não persiste clínica com localização inconsistente.
- As mensagens de erro ficam compreensíveis em pt-BR.
- O comportamento do formulário passa a corresponder à expectativa do usuário.

