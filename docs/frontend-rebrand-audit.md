# Auditoria do Rebrand Visual — Fase 2

## Status

Levantamento factual, somente leitura. Nenhum código alterado por este documento.

## Contexto

A Fase 1 do rebrand (tokens de marca esmeralda/ciano, sidebar, topbar, `PageHeader`,
`Table`, `MetricCard`, `ActionCard`, `Badge`, `CompanyAvatarMark`) já foi aplicada aos
componentes compartilhados e a duas telas piloto (`Empresas clientes`,
`Assinaturas SaaS`). Esta auditoria cataloga o que falta para que **todas** as telas
cheguem ao mesmo padrão visual, organizado pelas categorias pedidas: botões,
transições, tabelas, fontes, cards, rodapé, textos, background, ícones.

## 1. Tabelas sem marca colorida (avatar/ícone)

`CompanyAvatarMark` (iniciais com gradiente de marca) só está aplicado em
`clinic-table.tsx` e `platform-saas-subscriptions-page.tsx`. Nenhuma outra listagem
usa a caixa cinza antiga (ela já foi removida onde existia) — o problema nas 9
tabelas abaixo é a **ausência total de qualquer marca visual**, só texto puro:

| Tabela | Entidade |
|---|---|
| `features/patients/components/patients-table.tsx` | Pacientes |
| `features/membership-plans/components/membership-plans-table.tsx` | Planos |
| `features/membership-benefits/components/membership-benefits-table.tsx` | Benefícios |
| `features/benefit-usage/components/benefit-usage-table.tsx` | Uso de benefícios |
| `features/subscriptions/components/subscriptions-table.tsx` | Assinaturas (clínica) |
| `features/billing/components/patient-payments-table.tsx` | Pagamentos de pacientes |
| `features/audit-log/components/audit-log-table.tsx` | Auditoria |
| `features/crm/components/leads-table.tsx` | CRM (dormente) |
| `features/contracts/components/contracts-page.tsx` | Contratos (dormente) |

## 2. Botões de ação de linha ainda grandes/bordados

Padrão antigo (`size="icon"` 40px + `variant="outline"`/`"destructive"`), ainda em 5
arquivos / 28 ocorrências:

- `features/subscriptions/components/subscription-row-actions.tsx` (linhas 194, 225, 253, 286, 320, 352)
- `features/membership-benefits/components/membership-benefit-row-actions.tsx` (151, 178, 209, 240)
- `features/patients/components/patient-row-actions.tsx` (176, 198, 219, 267, 318, 352, 382)
- `features/membership-plans/components/membership-plan-row-actions.tsx` (151, 197, 210, 233, 266, 297, 327)
- `features/crm/components/lead-row-actions.tsx` (105, 130, 148, 167)

Já migrados para `size="icon-sm"`/`"icon-xs"` + `variant="ghost"`: `clinic-row-actions.tsx`,
`platform-saas-subscriptions-page.tsx`, `platform-saas-payments-page.tsx`,
`platform-users-overview-panel.tsx`, `saas-subscription-details-panel.tsx`,
`patient-invoice-actions.tsx`, `clinic-invoice-actions.tsx`.

## 3. Raio de borda inconsistente ("bordas arredondadas aplicadas em cima")

Três valores de raio concorrendo em superfícies do mesmo nível (modal/card grande):

- `2rem` — `features/auth/components/auth-card.tsx:38`, `app/(auth)/login/page.tsx:120`
- `1.25rem` — `components/ui/dialog.tsx:66`, `features/clinic/components/clinic-dialog.tsx:420`
- `xl`/padrão do token `--radius-lg` — `components/ui/alert-dialog.tsx:61`

Pills, avatares e badges em `rounded-full` estão corretos e não entram nesta lista
(é o uso esperado da forma).

## 4. Tipografia

Escala atual (`app/globals.css`, tokens `--font-size-*`/`--line-height-*`):
xs 12/16 · sm 14/20 · md 16/24 · lg 18/28 · xl 20/30 · 2xl 24/32 · 3xl 30/38 · 4xl 36/44.

Comparado ao mockup aprovado (corpo ~13.5px, títulos de página ~21px, valores de
métrica ~23px), a escala do produto real é sensivelmente maior em todos os degraus —
provável causa raiz de "elementos muito grandes", mais do que espaçamento isolado.

Usos diretos de `text-3xl`/`text-2xl` fora do `PageHeader`/`MetricCard` (já ajustados)
que uma correção de escala afetaria:

- `app/not-found.tsx:15`, `app/error.tsx:34`, `app/(dashboard)/error.tsx:34`, `app/global-error.tsx:37`
- `features/billing/components/platform-commercial-catalog-page.tsx:137,149,165`
- `features/modules/components/modules-page.tsx:104,119,135,152`
- `features/users/components/users-overview-panel.tsx:625,636`

## 5. Cards

Cobertos pela Fase 1 via componentes compartilhados (`workspace-header`,
`workspace-section`, `metric-tile`, `attention-card`). Nenhum gap estrutural novo
encontrado além do raio de borda (item 3). Ponto em aberto: `.surface-card` e
`.form-shell` (`rounded-[1.25rem]`) devem ser reconciliados com a decisão do item 3.

## 6. Rodapé

Não existe rodapé em `app/(dashboard)/layout.tsx` nem em `components/layout/*` — não
é uma regressão, nunca existiu. Não é gap do rebrand; registrado apenas para constar
que foi verificado.

## 7. Textos

i18n fragmentado (achado herdado da UI-000, ainda parcialmente verdadeiro): ver item 8
— telas com controles HTML crus tendem a ser as mesmas com texto fora de
`messages/pt-BR.json` (`contracts`, `crm`, partes de `modules`/`messages`).

## 8. Background

Wash de gradiente animado da marca já está em `body` e em `.workspace-header`
(compartilhados, cobre todas as telas). Nenhum gap adicional encontrado.

## 9. Ícones

Tamanho consistente (`size-4` em ícones de linha, `size-5` em ícones de cabeçalho/chip)
nos arquivos já verificados. Como as 9 tabelas do item 1 não têm nenhum ícone hoje, não
há inconsistência ativa — mas ao adicionar marca visual a elas, seguir essa convenção
já estabelecida em `clinic-table.tsx`/`action-card.tsx`.

## 10. Controles nativos (`<select>`/`<input>` crus) — parcialmente limpo desde UI-000

UI-000 (auditoria original) encontrou 47 ocorrências em 23 arquivos. Hoje restam
**32 ocorrências visíveis em 11 arquivos** (contando só controles de formulário
reais — não inclui `<input type="hidden">` usados em `<form action={...}>`, que não
são um gap visual):

- `features/contracts/components/contracts-page.tsx` — maior concentração (11 ocorrências: `<select>` 456, 632; `<input>` 179, 250, 257, 293, 313, 427, 449, 625, 675)
- `features/crm/components/lead-dialog.tsx:193`, `features/crm/components/leads-table.tsx:138,169`
- `features/users/components/users-overview-panel.tsx` (5: 224, 229, 269, 366, 926)
- `features/users/components/platform-users-overview-panel.tsx:85`
- `features/billing/components/platform-saas-payments-page.tsx:489,515`
- `features/modules/components/modules-page.tsx:478,502`
- `features/messages/components/support-threads-page.tsx:445,549`
- `features/membership-benefits/components/membership-benefit-dialog.tsx:293`
- `features/membership-plans/components/platform-plan-form.tsx:23`
- `features/auth/components/login-form.tsx:80` — **verificar antes de mexer**: pode ser `<input>` nativo intencional (autofill de senha/e-mail).

Controles nativos herdam a aparência do navegador, não o design system — no mockup,
todo filtro é um `Select`/`Input` estilizado. Isso é tão visível quanto qualquer outra
diferença de cor.

> **Correção (UI-029):** todas as ocorrências acima eram `<input type="hidden">`,
> não controles visíveis. A migração já estava completa. Ver
> `tasks/review/UI-029-native-controls-cleanup.md`.

## Fora de escopo (regra mandatória do CLAUDE.md)

`features/crm` (inclui `leads-table.tsx`, `lead-dialog.tsx`, `lead-row-actions.tsx`),
`features/messages` (comunicação) e `features/contracts` (dormente, fora do V1 descrito
em `CLAUDE.md`) **não** entram no backlog abaixo. O CLAUDE.md proíbe explicitamente
alterar CRM, agendamento ou módulos de comunicação. Essas telas aparecem nos achados
acima só porque a varredura foi exaustiva — não geram task.

## Ordem recomendada

Ver `tasks/backlog/README-FRONTEND.md` (seção "Fase 2 — Rebrand"), tasks UI-021 a UI-031.
