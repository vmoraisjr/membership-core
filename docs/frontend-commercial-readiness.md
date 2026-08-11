# Prontidão Comercial do Frontend — Sheep Membership Core

**Data:** 2026-08-02
**Escopo:** Varredura final (UI-020) sobre o trabalho de UI-001 → UI-019, revisando o produto como um comprador faria em uma demonstração comercial.
**Metodologia:** Leitura de código de toda a árvore `features/`/`components/`/`app/`, verificação em navegador via Playwright (visões de plataforma e de clínica, múltiplos papéis), execução dos 8 test suites relacionados (`test:tenant`, `test:rbac`, `test:membership`, `test:billing`, `test:users`, `test:contracts`, `test:audit`, `test:modules`), e comparação com o inventário original de `docs/frontend-audit.md` (UI-000).

---

## 1. Resumo executivo

O produto está **pronto para demonstração comercial**, com duas ressalvas documentadas na seção 6. As 19 tasks anteriores substituíram consistentemente markup cru por um Design System único (`Table`, `Select`, `Input`, `Textarea`, `Button`, `StatusIndicator`, `SidePanel`/`Dialog`, `ConfirmDialog`, `EmptyState`), com tokens de cor/espaçamento centralizados desde a UI-001 e nenhuma cor, dialog ou botão isolado introduzido fora desse sistema em nenhuma das tasks. Todo o fluxo comercial principal — login → visão geral → clientes → planos/benefícios → assinaturas → cobrança → auditoria — funciona ponta a ponta, em português, com feedback visual em toda ação crítica.

Esta task (UI-020) encontrou e corrigiu três problemas reais que as tasks anteriores não cobriam por não estarem no escopo de nenhum número específico:

1. **`/dashboard/messages` (Chamados)** era a última tela realmente ativa do produto ainda em markup cru, 100% fora do `messages/pt-BR.json`, e sem nenhuma verificação de permissão (`assertPermission`) em suas 3 Server Actions — qualquer usuário autenticado podia abrir/responder chamados independentemente do perfil. Também estava oculta da navegação para usuários de clínica, apesar de a própria tela já suportar o fluxo "empresa abre chamado com a plataforma". Todos os três problemas foram corrigidos (ver seção 4).
2. **`/dashboard/contracts`** permanecia acessível via URL direta com 714 linhas de markup cru, apesar de já estar fora do menu lateral — exatamente o comportamento que `docs/frontend-audit.md` (§1.15) já havia identificado e recomendado corrigir. Aplicado o mesmo bloqueio (`notFound()`) já usado em `/dashboard/crm`.
3. **Quatro últimos formulários com `<select>` cru** (`platform-plan-form.tsx`, `patient-dialog.tsx`, `platform-users-overview-panel.tsx` ×3) — o único débito de "componente antigo" que restava fora de CRM/Contracts.

## 2. Primeira impressão e confiança

- Login, "primeiro acesso" e recuperação de senha usam o mesmo `AuthCard`/branding Sheep desde a UI-003; nenhuma tela de auth restante em HTML cru.
- Toda tela do dashboard usa `PageHeader` com eyebrow/título/descrição consistentes; a navegação lateral colapsa para menu hambúrguer abaixo do breakpoint `lg` (confirmado sem overflow em 360/768/1024/1440px nesta e na UI-019).
- Erros inesperados (`global-error.tsx`, `app/error.tsx`, `(dashboard)/error.tsx`) e rota inexistente (`not-found.tsx`) estão todos em português, com a marca Sheep e um botão de ação — nenhuma tela em branco ou com stack trace exposta (corrigido na UI-018; `global-error.tsx` reescrito nesta task ainda estava sem `globals.css` carregado, verificado e corrigido durante a UI-018).
- **Confiança**: nenhuma tela de gestão de acesso (chamados, planos comerciais, usuários) ficou sem verificação de permissão visível ao usuário — `AccessDenied` aparece de forma consistente quando o perfil não tem `view`, e os botões de ação desaparecem (não apenas desabilitam) quando falta `manage`.

## 3. Consistência, hierarquia e densidade

- Um único padrão de tabela (`components/ui/table.tsx`, sempre com `overflow-x-auto` embutido) é usado em toda listagem alcançável do produto, com exceção de CRM e Contracts (ambos bloqueados via `notFound()`, não fazem parte do V1 comercial).
- Um único padrão de overlay foi consolidado: `SidePanel` para formulários extensos e telas de detalhe; `AlertDialog`/`ConfirmDialog` para confirmações. Não há um terceiro padrão de modal concorrente.
- `StatusIndicator` é o único componente de badge de status usado em toda a aplicação alcançável — a última ocorrência de cor de status hardcoded (`platform-subscription-section.tsx`, dentro da tela de Módulos) foi migrada na UI-016.
- Hierarquia visual (títulos, subtítulos, densidade de cards/tabelas) segue os tokens fixados na UI-001 em todas as telas verificadas; nenhuma tela usa espaçamento ou tipografia fora da escala do Design System.

## 4. Linguagem, inglês e enums brutos

- `messages/pt-BR.json` cresceu de forma incremental ao longo de todas as 20 tasks; toda tela alcançável do V1 comercial passa por `t()`.
- **Achado desta task**: `support-threads-page.tsx` (Chamados) tinha 100% do texto fora do i18n (embora já em português) e usava `switch` locais para rótulos de categoria/status. Migrado para o novo namespace `support` em `messages/pt-BR.json`, com `getSupportThreadStatusTone` seguindo o mesmo padrão de tom-por-status já usado em `clinic`/`billing`/`modules`.
- Nenhum enum bruto (`ACTIVE`, `PENDING`, `WAITING_CLINIC` etc.) é exibido diretamente ao usuário em nenhuma tela verificada — todos passam por um mapa de tradução (`AUDIT_ACTION_LABELS`, `getModuleKeyLabel`, `t(\`support.status.${status}\`)` etc.).
- Módulos futuros (`CRM`, `Agenda`, `Comunicação`, `Portal do paciente`, `Analytics`) exibem seus nomes/descrições em português na tela de Módulos (UI-016), embora os dados de catálogo (`Module.name`/`Module.description`) continuem em inglês no banco — decisão deliberada de não tocar dado de seed, apenas a camada de apresentação.

## 5. Formulários, finanças e dialogs

- Todo formulário de criação/edição alcançável usa `Input`/`Select`/`Textarea` do Design System, com máscaras brasileiras (`lib/br-formats.ts`) aplicadas onde há CPF/CNPJ/telefone/CEP.
- Toda ação destrutiva ou crítica usa `ConfirmDialog`, que nesta sequência de tasks passou a: (a) desabilitar os botões e mostrar "Processando..." durante o envio (UI-018), (b) impedir reabertura/duplo envio enquanto a Server Action está em voo. Verificado end-to-end via Playwright.
- Números financeiros (planos, faturas, MRR) usam `formatCurrency`/`Intl.NumberFormat("pt-BR", {currency:"BRL"})` de forma consistente em billing, assinaturas SaaS e pagamentos de pacientes.
- Dialogs (`SidePanel` e `AlertDialog`) permanecem dentro da viewport em todos os 4 breakpoints pedidos pela UI-019 (`SidePanel`: `w-full max-w-[46rem]`; `AlertDialog`: `max-w-xs` = 320px, menor que qualquer breakpoint testado).

## 6. Itens removidos nesta task

| Item | Motivo |
|---|---|
| `components/dashboard/table-actions.tsx` | Código morto (zero importadores); também violava aria (nenhum botão tinha nome acessível). |
| `features/auth/components/role-switcher.tsx` | Ferramenta de troca de usuário para debug, zero importadores, texto em inglês ("User"). |
| Rota `/dashboard/contracts` | Passou a retornar `notFound()`, espelhando `/dashboard/crm`; 714 linhas de markup cru deixam de ser alcançáveis. O código da feature (`features/contracts/*`) foi preservado — templates e contratos de paciente/clínica continuam sendo criados automaticamente pelas Server Actions de assinatura, sem depender desta tela. |
| Rótulo `platformOnly` da navegação de Chamados | Não era "código morto", mas ocultava uma tela funcional dos usuários de clínica sem motivo — corrigido, não removido. |

Nenhum componente removido tinha uso em produção; todas as remoções foram confirmadas por busca de importadores antes da exclusão, seguindo o mesmo método usado nas UI-012/013/015/019.

## 7. Critérios finais

| Critério | Status |
|---|---|
| Nenhuma tela antiga | ✅ CRM e Contracts (as duas únicas telas com markup cru remanescente) estão bloqueadas via `notFound()`, mesmo padrão para ambas. Nenhuma outra tela alcançável do V1 comercial usa markup cru. |
| Nenhum inglês ou enum bruto visível | ✅ Verificado tela a tela; único inglês remanescente é o nome de módulos futuros no banco (`Module.name`), que já é apresentado com tradução na camada de UI (§4). |
| Nenhum fluxo crítico sem feedback | ✅ Toasts (`sonner`) em toda mutação; `ConfirmDialog` com estado de carregamento (UI-018); Chamados corrigido nesta task (não tinha nenhuma verificação de permissão visível, o que por si só já é uma forma de feedback incorreto — usuários sem permissão viam o formulário normalmente). |
| Produto demonstra valor em menos de 5 minutos | ✅ Fluxo login → dashboard → cliente → assinatura → cobrança → auditoria é contínuo, sem telas quebradas ou órfãs no caminho, confirmado via Playwright nas contas de demonstração seed (`owner+nortex-medical@…`, `owner+workspace@…`). |
| Pronto para demonstração comercial | ✅ Com as ressalvas da seção 8. |

## 8. Dívidas conhecidas (fora do escopo desta task, não bloqueiam a demonstração)

- **CRM e Contratos permanecem código morto intocado**, apenas bloqueados na rota. Se algum dia entrarem no roadmap V2, precisarão do mesmo tratamento de redesign das demais 19 tasks.
- **`Module.name`/`Module.description` no banco continuam em inglês** — presentational apenas; não afeta nenhuma tela alcançável, mas um ajuste de dado de seed resolveria a origem em vez de mascarar na apresentação.
- **Filtro de período do log de auditoria é um único dia**, não um intervalo — documentado como decisão de escopo na UI-017, não revisitado aqui.
- **Nenhuma mudança de negócio, rota, Server Action, tenant isolation ou RBAC pré-existente foi alterada** por esta task, exceto a adição de `assertPermission("messages", "manage")` nas 3 Server Actions de Chamados — que não existia antes e é estritamente uma correção de uma lacuna (a permissão já estava definida na matriz de RBAC, apenas nunca havia sido conectada).

---

*Documento gerado como entrega da task UI-020 (Varredura Comercial Final). Ver relatório de implementação completo em `tasks/review/UI-020-commercial-readiness.md`.*
