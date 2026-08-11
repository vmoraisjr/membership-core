# UI-044 - Bug: Catálogo Comercial Só Permite Editar um Item — Relatório de Implementação

## Objetivo da task

Investigar e corrigir por que o Catálogo comercial aparentemente só
permite editar um item.

## Investigação

Auditei toda a cadeia envolvida, sem reprodução ao vivo (sem ferramenta
de navegador nesta sessão):

1. **`platform-commercial-catalog-page.tsx`** — cada plano na listagem
   renderiza sua própria instância de `PlatformPlanSidePanel mode="edit"
   initialData={plan}`, dentro de um `.map()` com `key={plan.id}` no
   elemento pai — sem problema de compartilhamento de estado entre
   linhas.
2. **`platform-plan-side-panel.tsx`** — estado (`open`) é local por
   instância (`useState`), sem contexto/singleton global. Correto.
3. **`platform-plan-form.tsx`** — campo oculto `planId` deriva
   corretamente de `initialData?.id ?? ""` (vazio no modo criação,
   preenchido com o id certo no modo edição). Correto.
4. **`saveClinicBillingPlanAction`** — se `planId` vier preenchido,
   executa `update` nesse id; se vier vazio, executa `create`. Lógica
   correta para suportar múltiplos planos.
5. **`ClinicBillingPlan` (schema Prisma)** — `name` é `String` comum,
   **sem** `@unique`. Nada no schema impede múltiplos planos.
6. **`ensureDefaultClinicBillingPlan`** (roda no início de
   `getPlatformClinicBillingOverview()`, que alimenta esta tela) — só
   garante que existe **um** plano chamado "Sheep Growth" (busca por
   nome, cria se não existir, resincroniza os campos se já existir).
   Não impede criar outros planos — só garante que esse específico
   sempre existe.

## Conclusão

**Não encontrei bug de código.** A causa mais provável, com base na
auditoria: hoje só existe **um** plano comercial cadastrado no banco
("Sheep Growth", o padrão auto-provisionado) — por isso só aparece um
item na lista, e é claro que só dá para "editar" o que existe. O botão
"+ Novo plano" (`PlatformPlanSidePanel mode="create"`) já existe na tela
e, pela auditoria de código, deveria criar um segundo plano
normalmente. Esse achado já estava registrado no relatório da UI-014
("só existe um plano SaaS comercial provisionado hoje... não há seleção
real de plano na criação de clínica").

## Próximo passo recomendado (não executado nesta task)

Confirmar ao vivo: clicar em "+ Novo plano", preencher e salvar; se um
segundo item aparecer normalmente na lista e puder ser editado
independente do primeiro, o caso está encerrado como "não é bug, é
dado". Se a criação falhar silenciosamente ou sobrescrever o plano
existente, é um bug real que a auditoria estática não capturou (ex.:
comportamento de cache/revalidação específico do Next.js só visível em
runtime) — nesse caso, reabrir com o log de erro real do navegador.

## Arquivos modificados

Nenhum — investigação sem reprodução confirmada de bug de código.

## Validação executada

Não aplicável (nenhuma mudança de código).

## Riscos

Nenhum.

## Próxima task sugerida

`UI-045-modules-catalog-hydration-error.md`.
