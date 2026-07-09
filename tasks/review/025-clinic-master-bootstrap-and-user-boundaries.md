# Task 025 - Clinic Master Bootstrap and User Boundaries

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

Implementar a dinâmica correta de bootstrap de usuários ao criar uma clínica:

- a criação da clínica deve gerar um usuário master da clínica;
- esse usuário deve usar o e-mail informado no cadastro da clínica;
- ele deve receber senha padrão temporária;
- a senha deve ser obrigatoriamente trocada no primeiro acesso;
- a gestão dos usuários da clínica deve acontecer com esse novo usuário;
- o usuário master da plataforma não deve acessar nem administrar os demais usuários da clínica.

---

## Contexto

O fluxo atual mistura o papel do usuário master da plataforma com o contexto operacional da clínica.

Na prática, isso gera dois problemas de negócio:

1. O master da plataforma passa a assumir indevidamente o papel de usuário da clínica.
2. A clínica nasce sem um administrador próprio claramente bootstrapado para gerir seus usuários.

O comportamento esperado é diferente:

- o master da plataforma cria a clínica;
- o sistema cria automaticamente o master da clínica;
- esse novo usuário entra na clínica com senha provisória;
- no primeiro acesso, troca a senha e passa a administrar os usuários daquele tenant;
- o master da plataforma não enxerga a lista de usuários da clínica, exceto a capacidade controlada
  de redefinir a senha do master da clínica.

---

## Regras de Negócio

### 1. Criação da clínica

Ao criar uma clínica, o sistema deve:

- persistir a clínica normalmente;
- criar um `AppUser` vinculado à clínica criada;
- usar o e-mail informado no cadastro da clínica como login desse usuário;
- atribuir a esse usuário o papel administrativo máximo permitido para a clínica;
- manter o usuário master da plataforma fora da clínica, com `clinicId: null`.

### 2. Senha padrão temporária

O usuário master da clínica deve nascer com uma senha padrão temporária.

Requisitos:
- a senha inicial deve ser definida de forma controlada pelo sistema;
- a senha não pode ser tratada como senha definitiva;
- o fluxo deve informar claramente que a troca é obrigatória no primeiro acesso.

Decisão de implementação a confirmar no código:
- senha fixa de ambiente controlado; ou
- senha temporária aleatória exibida no momento da criação; ou
- token de ativação com definição inicial de senha.

Para V1, a task deve escolher uma abordagem simples, auditável e segura o suficiente para homologação.

### 3. Troca obrigatória no primeiro acesso

O usuário master da clínica deve ser forçado a trocar a senha no primeiro login.

Comportamento esperado:
- login com senha temporária funciona;
- antes de acessar o dashboard completo, o sistema exige nova senha;
- após troca bem-sucedida, o bloqueio some;
- a senha temporária deixa de ser válida como senha de uso operacional.

### 4. Administração de usuários da clínica

Após o bootstrap:
- o master da clínica passa a ser o responsável por convidar e administrar usuários da clínica;
- os demais usuários da clínica continuam restritos ao tenant.

### 5. Limites do master da plataforma

O master da plataforma:
- pode criar clínica;
- pode consultar dados de plataforma conforme RBAC;
- pode acionar redefinição de senha do master da clínica;
- não pode visualizar listagem completa de usuários da clínica;
- não pode administrar diretamente os demais usuários da clínica;
- não deve ser tratado como membro operacional da clínica.

### 6. Redefinição de senha do master da clínica

Deve existir fluxo explícito para o master da plataforma:
- localizar o master da clínica;
- redefinir sua senha temporária quando necessário;
- auditar essa operação.

Essa capacidade deve ser limitada ao master da clínica, não aos demais usuários do tenant.

---

## Escopo

### 1. Modelagem de autenticação e estado do usuário

Avaliar necessidade de adicionar campo(s) como:
- `mustChangePassword`
- `temporaryPasswordIssuedAt`
- `passwordResetRequired`

Se o modelo atual já suportar isso por outro mecanismo, documentar a decisão.

### 2. Bootstrap do usuário master da clínica

Ao concluir `createClinic`, o fluxo deve:
- criar também o usuário master da clínica;
- garantir unicidade de e-mail;
- tratar conflito caso o e-mail já exista;
- registrar auditoria da criação da clínica e do usuário bootstrapado.

### 3. Fluxo de primeiro acesso

Implementar ou adaptar:
- tela/interceptação para troca obrigatória de senha;
- action segura para atualizar a senha;
- bloqueio de navegação até concluir a troca.

### 4. Fronteiras de acesso na área de usuários

Ajustar a tela e os serviços de usuários para que:
- usuários de clínica vejam apenas sua clínica;
- o master da plataforma não veja os usuários internos da clínica;
- a única exceção administrativa global seja a redefinição de senha do master da clínica, em fluxo próprio.

### 5. Auditoria

Registrar em audit log, no mínimo:
- criação do usuário master da clínica;
- primeiro acesso;
- troca obrigatória de senha;
- redefinição de senha do master da clínica feita pelo master da plataforma.

### 6. Cobertura de testes

Adicionar ou atualizar testes para garantir:
- criar clínica gera o usuário master da clínica;
- o master da plataforma permanece fora da clínica;
- o master da clínica é obrigado a trocar a senha no primeiro acesso;
- o master da clínica consegue administrar usuários do próprio tenant;
- o master da plataforma não consegue listar ou administrar usuários comuns da clínica;
- o master da plataforma consegue apenas redefinir a senha do master da clínica.

---

## Fora de Escopo

- Envio real de e-mail transacional, se ainda não existir.
- Portal avançado de onboarding.
- MFA.
- Gestão global de todos os usuários da clínica pelo master da plataforma.

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

Se o fluxo de primeiro acesso não estiver coberto hoje, criar testes dedicados.

---

## Testes Manuais Esperados

- [ ] Criar clínica gera automaticamente o usuário master da clínica.
- [ ] O login desse usuário usa o e-mail cadastrado na clínica.
- [ ] O primeiro acesso exige troca de senha.
- [ ] Após trocar a senha, o usuário master da clínica acessa normalmente o sistema.
- [ ] O master da clínica consegue convidar e administrar usuários da própria clínica.
- [ ] O master da plataforma não vê os demais usuários da clínica.
- [ ] O master da plataforma consegue redefinir apenas a senha do master da clínica.
- [ ] A redefinição gera nova credencial temporária e volta a exigir troca no primeiro acesso.

---

## Critérios de Aceite

- Cada clínica nasce com um usuário master próprio.
- O usuário master da plataforma não é mais usado como administrador operacional da clínica.
- A senha inicial do master da clínica é temporária e exige troca no primeiro acesso.
- A administração de usuários da clínica passa a ocorrer dentro do tenant, pelo master da clínica.
- O master da plataforma fica restrito à redefinição de senha do master da clínica.
- Tenant isolation e RBAC permanecem preservados.

