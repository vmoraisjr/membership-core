# UI-016 - Gestão de Módulos — Relatório de Implementação

## Objetivo da task

Criar área comercial de módulos. Exibir módulo, descrição, status, disponibilidade, clínica e ativação. V1: Membership ativo; CRM, Agenda, Comunicação, Analytics e Portal aparecem somente na administração da plataforma como "Em breve" ou desabilitados, sem rotas ativas. Critérios de aceite: sem promessa enganosa, disponível e futuro diferenciados, ativação/desativação confirmada.

## Auditoria prévia

`ModulesPage` (`features/modules/components/modules-page.tsx`) já continha toda a lógica de negócio correta: `isModuleV1Active()` bloqueia qualquer módulo além de Membership em V1, `ensureClinicModules()`/`enableClinicModuleAction`/`disableClinicModuleAction` já impedem desabilitar Membership e habilitar módulos futuros (coberto por `pnpm test:modules`), e a confirmação de ativação/desativação já usava `ConfirmSubmitButton` com diálogo — os critérios de aceite já estavam tecnicamente satisfeitos no nível de regra de negócio. O que faltava era exatamente presentation: duas tabelas HTML cruas (catálogo de módulos e cobertura por plano), uma terceira dentro de `PlatformSubscriptionSection` (histórico de pagamento), badges de status com classes Tailwind fixas em vez de `StatusIndicator`, e nomes/descrições de módulo em inglês vindos diretamente do seed (`DEFAULT_MODULES` em `module-access.ts`), quebrando o critério "100% pt-BR" herdado do CLAUDE.md e tornando a distinção "disponível vs futuro" menos clara do que deveria (rótulo "Futuro" genérico, não "Em breve" como o próprio texto da task pede).

Antes de tocar neste arquivo, corrigi na UI-015 um problema crítico de alcançabilidade: a rota `/dashboard/modules` redirecionava incondicionalmente para `/dashboard/billing` desde o commit inicial do projeto, então `ModulesPage` nunca era renderizada. Sem essa correção anterior, qualquer trabalho de apresentação aqui seria invisível para o usuário.

## Arquivos criados

- `features/modules/utils/module-labels.ts` — `getModuleKeyLabel(key)`/`getModuleKeyDescription(key)`, mapeando cada `ModuleKey` para nome/descrição em pt-BR via `messages/pt-BR.json`. Segue o mesmo padrão já usado em `AUDIT_ACTION_LABELS`/`AUDIT_ENTITY_LABELS` e `getRoleLabel`: traduz na camada de apresentação sem alterar `module.name`/`module.description` armazenados no banco (que continuam em inglês, definidos em `DEFAULT_MODULES` — dado de seed, fora do escopo de "substitua apenas a camada de apresentação").

## Arquivos modificados

- `features/modules/components/modules-page.tsx` — as três tabelas cruas (catálogo de módulos, cobertura por plano, módulos da clínica) migradas para `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell`; status/disponibilidade migrados para `StatusIndicator` (verde para disponível/ativo, neutro para "Em breve"/inativo); nomes e descrições de módulo passaram a usar `getModuleKeyLabel`/`getModuleKeyDescription`; todo texto (títulos, métricas, colunas) migrado para `messages/pt-BR.json`.
- `features/billing/components/platform-subscription-section.tsx` — renderizada dentro de `ModulesPage` (visão de clínica); sua tabela de histórico de pagamento e o badge de status da assinatura, ambos com cores fixas duplicadas (`getSubscriptionStatusClass`/`getPaymentStatusClass`, quase idênticas às já removidas na UI-015), migrados para `Table`/`StatusIndicator`, reutilizando `getClinicSubscriptionStatusTone`/`getPaymentStatusTone` de `features/clinic/utils/clinic-status.ts` em vez de duplicar a lógica de cor pela terceira vez no projeto.
- `messages/pt-BR.json` — namespace `modules` estendido com `platformTitle`/`platformDescription`, `metrics.*`, `plansSection.*`, `catalogSection.*`, `coverageSection.*`, `keys.*` (nome/descrição por `ModuleKey`) e `clinicTable.availabilityColumn`; a chave existente `modules.future` mudou de "Futuro" para "Em breve", alinhando com a redação exata pedida pelos critérios de aceite da task — usada em todos os 3 lugares que indicam módulo não disponível em V1 (fonte única, sem duplicar o rótulo).

## Decisões arquiteturais

- **Não criei uma tela nova de "gestão de módulos por clínica" para a plataforma.** A task lista "clínica" entre os campos a exibir, mas isso já é atendido pela aba **Módulos** da página de detalhes de cada clínica, adicionada na UI-014 (`PlatformClinicDetailsPage`) — que já mostra módulo, status e disponibilidade por clínica específica, somente leitura. Duplicar essa visão dentro de `ModulesPage` (que hoje é uma visão agregada por plataforma) reintroduziria exatamente o tipo de tela divergente que a UI-015 acabou de eliminar para planos comerciais.
- **Não implementei habilitar/desabilitar módulos a partir da visão de plataforma para uma clínica arbitrária.** As Server Actions atuais (`enableClinicModuleAction`/`disableClinicModuleAction`) operam sobre `getCurrentClinicId()` — a clínica do usuário logado — não sobre uma clínica escolhida pela plataforma. Adicionar isso exigiria uma nova Server Action com um parâmetro de clínica explícito e sua própria trilha de RBAC/auditoria; como nenhum módulo além de Membership é ativável em V1 (`isModuleV1Active`), essa ação não teria efeito prático hoje e foi documentada aqui como fora de escopo, não implementada.
- **Reaproveitei os tons de status de `features/clinic/utils/clinic-status.ts`** (criados na UI-014, já usados na UI-015) em vez de criar um quarto conjunto de funções de cor — a mesma decisão tomada nas duas tasks anteriores para esta família de status.
- **Dado de seed (nomes/descrições de módulo em inglês) não foi alterado.** A tradução acontece só na camada de apresentação (`getModuleKeyLabel`/`getModuleKeyDescription`), preservando `DEFAULT_MODULES` como fonte de dados intocada — consistente com "substitua apenas a camada de apresentação e interação".

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 28 rotas geradas.
- `pnpm test:modules` — ✅ os 4 cenários (apenas Membership ativo em V1, módulos futuros bloqueados mesmo com dados existentes, Membership não pode ser desabilitado, staff sem permissão de gestão).
- `pnpm test:billing` — ✅ os 7 cenários.
- `pnpm test:tenant` — ✅ os 11 cenários.
- `pnpm test:rbac` — ✅ os 5 cenários.
- **Verificação em navegador (Playwright)**:
  - Visão de plataforma (`owner+workspace@membership-core.local`): "Catálogo de módulos" lista os 6 módulos com nome/descrição em pt-BR, badge "Ativo" (verde) só para Membership, "Em breve" (neutro) para os demais, coluna "Regra" com "Disponível na operação atual"/"Reservado para expansões futuras"; "Cobertura por plano" mostra "Incluído"/"Em breve" por módulo e plano.
  - Visão de clínica (`owner+nortex-medical@membership-core.local`): "Módulos da clínica" mostra Membership com status "Ativo"/disponibilidade "Ativo"/ação "Módulo principal" (somente leitura); os 5 módulos futuros com status "Inativo"/disponibilidade "Em breve"/ação "Apenas V2" — nenhum botão de habilitar/desabilitar aparece para eles, confirmando que a regra de negócio (não implementável em V1) continua bloqueada na camada de apresentação; "Assinatura da plataforma" e "Histórico de pagamento" migrados para `Table`/`StatusIndicator` sem alteração de dado.
  - 0 erros de console em ambas as visões.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Baixo: nenhuma Server Action nem regra de negócio foi alterada. As mudanças em `platform-subscription-section.tsx` e `modules-page.tsx` são estritamente de apresentação (tabela + cor + texto); os 4 cenários de `test:modules` cobrem exatamente as regras que protegem contra habilitar módulos futuros ou desabilitar Membership, e continuam passando sem alteração.

## Próxima task sugerida

`UI-017-audit-log.md`.
