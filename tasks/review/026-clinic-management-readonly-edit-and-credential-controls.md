# Task 026 - Clinic Management Readonly Edit and Credential Controls

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

Melhorar o gerenciamento da clínica para que o formulário de edição funcione
como uma área administrativa mais segura, com modo inicial somente leitura,
edição explícita e controles do master da clínica no mesmo fluxo.

---

## Contexto

Hoje a edição da clínica abre diretamente em modo editável.

Também existe a redefinição da senha do master da clínica como ação separada na
lista de clínicas, fora do contexto do formulário.

O comportamento esperado é mais administrativo:

- abrir a clínica primeiro em modo somente leitura;
- acionar explicitamente a edição;
- confirmar explicitamente as alterações;
- concentrar no mesmo formulário os controles de credencial do master da clínica.

---

## Escopo

### 1. Modo inicial somente leitura

Ao abrir o formulário de edição da clínica:
- os campos devem aparecer inicialmente bloqueados para edição;
- o usuário deve visualizar os dados atuais com clareza;
- um botão explícito deve habilitar o modo de edição.

### 2. Fluxo de edição explícita

Quando o usuário entrar em modo de edição:
- os campos ficam editáveis;
- deve existir botão claro para confirmar/salvar as alterações;
- deve existir forma clara de cancelar a edição e voltar ao modo somente leitura;
- o fluxo não deve induzir alteração acidental.

### 3. Área de credenciais no mesmo formulário

O formulário de gerenciamento da clínica deve incluir a área de credenciais do
master da clínica:

- resetar senha temporária do master da clínica;
- exibir a nova senha em campo oculto por padrão;
- permitir revelar/ocultar a senha;
- indicar claramente que a nova senha exigirá troca no próximo acesso.

### 4. Envio da nova senha para o e-mail da clínica

Adicionar ação para envio da nova senha ao e-mail da clínica.

Se o envio real de e-mail ainda não existir:
- definir fallback explícito;
- exibir status claro da operação;
- documentar se será gerado apenas payload interno, token ou placeholder.

A task deve escolher uma abordagem compatível com o estágio atual do produto.

### 5. Regras de acesso

Definir com clareza quem pode executar cada ação:
- master da plataforma pode visualizar e gerenciar a clínica em contexto global;
- controles de credencial do master da clínica devem respeitar a política global;
- usuários da clínica não podem ganhar acesso indevido a ações exclusivas da plataforma.

### 6. Auditoria

Registrar em audit log:
- entrada em atualização de dados relevantes da clínica;
- reset de senha do master da clínica;
- envio da nova senha ao e-mail da clínica.

---

## Fora de Escopo

- Redesign amplo do dashboard.
- Sistema avançado de notificações por e-mail.
- Histórico completo de versões do cadastro da clínica.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:users
pnpm test:tenant
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

---

## Testes Manuais Esperados

- [ ] A edição da clínica abre inicialmente em modo somente leitura.
- [ ] O botão de editar habilita os campos.
- [ ] O botão de confirmar salva as alterações.
- [ ] O cancelamento volta ao modo somente leitura sem salvar mudanças indevidas.
- [ ] O reset de senha do master da clínica aparece no mesmo formulário.
- [ ] A senha nova fica oculta por padrão.
- [ ] É possível revelar e ocultar a senha.
- [ ] Existe botão para enviar a nova senha ao e-mail da clínica.

---

## Critérios de Aceite

- O gerenciamento da clínica fica mais seguro e explícito.
- A edição não acontece mais de forma implícita.
- Os controles de credencial do master da clínica ficam centralizados.
- O envio da nova senha ao e-mail da clínica possui comportamento claro.

