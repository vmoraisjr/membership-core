# Task 022 - Correções Críticas Pós-Teste Manual 01


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

Corrigir os primeiros bloqueios identificados no teste manual de homologação da V1.

Esta task é imprescindível para continuar os demais testes manuais, pois afeta autenticação, cadastro de clínica, convite de usuários e organização da tela de usuários.

---

## Contexto

Durante o primeiro ciclo de teste manual, foram identificados problemas logo nos fluxos iniciais:

1. Tela de login com label incorreta.
2. Campo de senha sem opção de visualizar senha.
3. Formulário de clínica parcialmente em inglês e com validações insuficientes.
4. Convite de usuários para a Clínica Alpha não funcionando.
5. Tela de usuários confusa, sem filtro por clínica.

---

## Escopo

### 1. Tela de Login

#### Problemas identificados

- A label do campo de senha está como `Nova Senha`.
- O correto é `Senha`.
- Falta botão para mostrar/ocultar senha.

#### Requisitos

- Alterar label para `Senha`.
- Adicionar botão/ícone para mostrar e ocultar senha.
- Manter acessibilidade mínima:
  - `aria-label`
  - estado visual claro.
- Não mexer no fluxo de `Esqueci minha senha` nesta task.

#### Fora de escopo

- Recuperação de senha.
- Redefinição de senha.
- E-mail de reset.

---

### 2. Formulário de Clínica

#### Problemas identificados

- Formulário ainda possui textos não traduzidos.
- Campo `slug` não deve ser obrigatório.
- Telefone precisa de validação.
- CEP precisa de validação.
- Cidade e Estado precisam de validação.

#### Requisitos

##### Tradução

Traduzir todos os textos visíveis do formulário de clínica para português do Brasil.

Exemplos:

```txt
Clinic -> Clínica
Name -> Nome
Phone -> Telefone
Address -> Endereço
City -> Cidade
State -> Estado
Zip Code -> CEP
```

##### Slug

- Campo `slug` não deve ser obrigatório para o usuário.
- Se o slug for necessário internamente, gerar automaticamente a partir do nome da clínica.
- Garantir unicidade.
- Se houver conflito, adicionar sufixo incremental ou identificador seguro.

##### Telefone

Validar padrão brasileiro:

- DDD obrigatório.
- Número obrigatório.
- Aceitar celular e fixo.

Exemplos válidos:

```txt
(11) 99999-9999
(11) 3333-3333
11999999999
1133333333
```

##### CEP

Validar CEP brasileiro:

```txt
00000-000
00000000
```

##### Cidade e Estado

- Cidade obrigatória.
- Estado obrigatório.
- Estado deve aceitar UF brasileira válida.

UFs válidas:

```txt
AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO
```

---

### 3. Convite de Usuários

#### Problema identificado

Não foi possível enviar convite de usuários para a Clínica Alpha.

#### Requisitos

Auditar e corrigir o fluxo de convite:

- formulário de convite;
- action de criação de convite;
- vínculo com `clinicId`;
- permissões/RBAC;
- tenant isolation;
- geração de token;
- exibição do token/link, se o envio real de e-mail ainda não existir;
- mensagens de sucesso/erro em pt-BR.

#### Critérios

- OWNER da Clínica Alpha consegue criar convite.
- Convite fica associado à Clínica Alpha.
- Convite aparece na lista de usuários/convites da Clínica Alpha.
- Usuário de outra clínica não consegue ver ou usar convite da Alpha.
- Se envio de e-mail não estiver implementado, exibir link/token para cópia manual.

---

### 4. Tela de Usuários

#### Problema identificado

A sessão de usuários está confusa/bagunçada.

#### Requisito principal

Adicionar filtro por clínica.

#### Regras

- Usuário de clínica comum deve ver apenas a própria clínica.
- Usuário/plataforma com permissão global, se existir, pode filtrar por clínica.
- Se ainda não houver camada clara de Platform Admin, não expor visão global para usuários de clínica.
- A listagem deve separar ou identificar claramente:
  - usuários ativos;
  - usuários pendentes;
  - convites pendentes;
  - usuários inativos.

#### Melhorias mínimas de UX

- Adicionar filtro por clínica quando aplicável.
- Adicionar filtro por status.
- Adicionar filtro por papel/perfil se simples.
- Traduzir labels para pt-BR.
- Melhorar empty states.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:tenant
pnpm test:rbac
pnpm test:users
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

Se algum teste relacionado a convite, usuário ou tenant não existir, criar ou atualizar cobertura mínima.

---

## Testes Manuais Esperados

### Login

- [ ] Campo exibe label `Senha`.
- [ ] Botão mostrar senha funciona.
- [ ] Botão ocultar senha funciona.
- [ ] Login continua funcionando.

### Clínica

- [ ] Formulário está em pt-BR.
- [ ] É possível criar clínica sem preencher slug.
- [ ] Slug é gerado automaticamente.
- [ ] Telefone inválido é bloqueado.
- [ ] CEP inválido é bloqueado.
- [ ] Cidade obrigatória é validada.
- [ ] Estado obrigatório é validado.
- [ ] UF inválida é bloqueada.

### Convite

- [ ] OWNER da Clínica Alpha cria convite.
- [ ] Convite aparece na tela de usuários da Clínica Alpha.
- [ ] Link/token do convite fica disponível se não houver envio de e-mail.
- [ ] Usuário de outra clínica não acessa convite da Alpha.

### Usuários

- [ ] Tela de usuários fica organizada.
- [ ] Filtro por clínica funciona quando aplicável.
- [ ] Usuário comum vê apenas sua clínica.
- [ ] Filtro por status funciona.
- [ ] Filtro por papel/perfil funciona se implementado.

---

## Critérios de Aceite

- Login corrigido.
- Formulário de clínica traduzido e validado.
- Slug não obrigatório para usuário.
- Convite de usuário funcionando para Clínica Alpha.
- Tela de usuários mais organizada.
- Filtro por clínica implementado quando aplicável.
- Tenant isolation preservado.
- RBAC preservado.
- Build, lint e typecheck passando.

---

<!-- ## Relatório

Ao concluir, criar:

```txt
tasks/review/022-correcoes-criticas-pos-teste-manual-01.md
```

O relatório deve conter:

- arquivos criados;
- arquivos modificados;
- problemas corrigidos;
- validações executadas;
- pendências;
- riscos restantes. -->

---

## Regras para o Codex

- Não implementar recuperação de senha nesta task.
- Não criar CRM, agenda ou comunicação.
- Não fazer redesign visual amplo.
- Não alterar regras de negócio fora do escopo.
- Não remover testes existentes.
- Não iniciar a próxima task automaticamente.
- Mover esta task para review ao concluir.
