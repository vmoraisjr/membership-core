# Task 023 - Platform Owner and Clinic Scope Reconciliation

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

Corrigir a inconsistência entre o contexto do usuário master/plataforma,
o vínculo com clínica e as contagens exibidas no dashboard e na tela de clínicas.

---

## Diagnóstico

Durante o teste manual, o fluxo atual expôs três problemas encadeados:

1. O cadastro de clínica vincula o próprio usuário master à clínica recém-criada.
2. O bootstrap de autenticação redefine o owner padrão para `clinicId: null` em todo login.
3. A tela de clínicas usa somente `currentUser.clinicId` para carregar dados, então um usuário
   de plataforma pode ver cards globais no dashboard e, ao mesmo tempo, uma lista de clínicas vazia.

### Causas raiz encontradas

#### 1. `createClinic` promove o master para contexto de clínica

Arquivo:
- `apps/web/features/clinic/actions/create-clinic.ts`

Hoje a action executa:

```ts
await tx.appUser.update({
  where: { id: currentUser.id },
  data: { clinicId: clinic.id },
});
```

Isso faz o usuário master deixar de operar como usuário de plataforma na sessão atual.

#### 2. O login reseta o owner padrão para fora da clínica

Arquivos:
- `apps/web/features/auth/actions/login.ts`
- `apps/web/features/auth/services/get-current-app-user.ts`

O login chama `ensureDefaultAppUsers()`.
Dentro dela, `ensurePlatformOwner()` força o owner bootstrap a:

```ts
data: {
  clinicId: null,
  role: AppUserRole.OWNER,
  status: AppUserStatus.ACTIVE,
}
```

Resultado:
- na mesma sessão após criar clínica, o master fica com `clinicId`;
- no próximo login, o bootstrap remove esse vínculo.

#### 3. A listagem de clínicas não suporta visão de plataforma

Arquivo:
- `apps/web/features/clinic/services/get-clinics.ts`

Hoje:
- se `currentUser.clinicId` for nulo, retorna `[]`;
- se houver `clinicId`, retorna apenas aquela clínica.

Isso entra em conflito com o dashboard de plataforma, que contabiliza todas as clínicas ativas em:
- `apps/web/features/dashboard/services/get-dashboard-metrics.ts`

E também com a UX da página:
- `apps/web/features/clinic/components/clinic-page.tsx`

Porque o botão de criar clínica aparece quando `clinics.length === 0`, mesmo para usuário de plataforma
que já possui clínicas cadastradas no banco mas não consegue listá-las pela regra atual.

---

## Impacto observado

- O usuário master aparece como usuário de clínica na aba de usuários.
- O master perde o contexto de plataforma na sessão atual.
- Após logout/login, o vínculo com a clínica desaparece por reset de bootstrap.
- O dashboard pode mostrar `N` clínicas ativas enquanto a tela de clínicas mostra zero ou menos itens
  do que o total real.
- A UI induz criação de clínica duplicada por esconder clínicas já existentes para o usuário de plataforma.

---

## Escopo

### 1. Definir comportamento correto do usuário de plataforma

A implementação deve deixar explícito um destes modelos:

- `OWNER/ADMIN` de plataforma nunca recebe `clinicId` ao criar clínica; ou
- a criação da clínica também cria/associa um usuário de clínica separado, sem descaracterizar o master.

Para V1, a opção preferencial é:
- preservar o usuário master como usuário de plataforma (`clinicId: null`);
- impedir mutação implícita do `clinicId` do master em `createClinic`.

### 2. Endurecer bootstrap de autenticação

Corrigir `ensurePlatformOwner()` para que ele:
- não sobrescreva associação de clínica de forma destrutiva sem intenção explícita;
- não altere contexto de usuários reais em todo login;
- continue garantindo existência do owner bootstrap local quando necessário.

### 3. Corrigir a visão de clínicas para contexto de plataforma

Quando o usuário atual for de plataforma e tiver permissão global:
- listar clínicas da plataforma;
- permitir busca/filtro sobre clínicas reais;
- exibir contagens consistentes com o dashboard.

Quando o usuário atual for de clínica:
- manter listagem restrita à própria clínica.

### 4. Ajustar UX de criação de clínica

Revisar a regra do botão de criação:
- não depender apenas de `clinics.length === 0`;
- respeitar o contexto correto de plataforma versus clínica;
- evitar que lista vazia causada por filtro/escopo incorreto sugira cadastro duplicado.

### 5. Cobertura de testes

Adicionar ou atualizar testes automatizados para garantir:
- criar clínica não muda o `clinicId` do usuário master/plataforma;
- login não reseta contexto de usuários indevidamente;
- dashboard de plataforma e tela de clínicas usam o mesmo universo de clínicas;
- usuário de clínica continua vendo somente a própria clínica.

---

## Validações Obrigatórias

Após implementação, rodar:

```bash
pnpm test:tenant
pnpm test:users
pnpm test:rbac
pnpm lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

Se a cobertura atual não pegar o fluxo de criação de clínica com usuário master,
adicionar teste dedicado.

---

## Testes Manuais Esperados

- [ ] Usuário master entra sem clínica associada e continua em contexto de plataforma.
- [ ] Dashboard de plataforma e tela de clínicas exibem o mesmo total de clínicas reais.
- [ ] Criar clínica como master não transforma o master em usuário daquela clínica.
- [ ] Logout/login não altera indevidamente o contexto do usuário master.
- [ ] Tela de usuários do master não passa a se comportar como tela da clínica recém-criada.
- [ ] Usuário de clínica continua vendo apenas sua própria clínica.

---

## Critérios de Aceite

- Master/plataforma não perde seu contexto ao criar clínica.
- Bootstrap de login não sobrescreve `clinicId` de forma indevida.
- Dashboard e tela de clínicas ficam semanticamente consistentes.
- Não é mais possível induzir criação duplicada por listagem vazia incorreta.
- Tenant isolation permanece preservado.
- RBAC permanece preservado.

