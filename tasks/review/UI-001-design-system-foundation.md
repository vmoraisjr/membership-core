# UI-001 - Fundação do Design System Sheep — Relatório de Implementação

## Objetivo da task

Criar a fundação visual definitiva do SaaS: tokens (cor, superfície, borda, sombra, radius, tipografia, espaçamento, estados, motion, breakpoints) e reestilização dos primitivos shadcn/ui, entregando `docs/design-system.md`.

## Auditoria prévia

A maior parte da fundação de tokens **já existia** em `app/globals.css` (produto de um trabalho anterior — commit `feat: frontend design` no histórico da branch), incluindo cor, superfície, borda, sombra, radius, tipografia, espaçamento e motion, todos centralizados em `:root`/`@theme inline`, sem cores hardcoded fora do arquivo de tokens. O trabalho desta task focou em:
1. Documentar formalmente esse sistema (não documentado antes).
2. Preencher as lacunas de componentes ainda ausentes da lista pedida pela task.

## Arquivos criados

- `docs/design-system.md` — documentação completa dos tokens e da biblioteca de componentes, incluindo critérios de uso `Dialog` vs `SidePanel` e a regra de adoção de `Select`/`DropdownMenu` para as próximas tasks.
- `components/ui/badge.tsx` — `Badge` com variantes semânticas.
- `components/ui/status-indicator.tsx` — `StatusIndicator`, componente central de status (tom + ponto), destinado a substituir os helpers de status duplicados por feature identificados em `docs/frontend-audit.md`.
- `components/ui/checkbox.tsx` — `Checkbox` (Radix).
- `components/ui/radio-group.tsx` — `RadioGroup`/`RadioGroupItem` (Radix).
- `components/ui/switch.tsx` — `Switch` (Radix).
- `components/ui/tabs.tsx` — `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (Radix).
- `components/ui/tooltip.tsx` — `Tooltip`/`TooltipTrigger`/`TooltipContent`/`TooltipProvider` (Radix).
- `components/ui/pagination.tsx` — `Pagination` e subcomponentes (padrão shadcn, construído sobre `buttonVariants` existente).
- `components/ui/breadcrumb.tsx` — `Breadcrumb` e subcomponentes (primitivo semântico).
- `components/ui/stepper.tsx` — `Stepper` (composição própria, sem equivalente Radix).
- `components/dashboard/error-state.tsx` — `ErrorState`, espelhando `EmptyState` já existente.

## Arquivos modificados

Nenhum. Todos os componentes existentes (`Button`, `Input`, `Textarea`, `Select`, `Card`, `Table`, `Dialog`, `AlertDialog`, `SidePanel`, `DropdownMenu`, `Skeleton`, `Toaster`) já estavam alinhados ao sistema de tokens e não precisaram de alteração.

## Decisões arquiteturais

- **Drawer/Sheet**: não foi criado um componente novo — `SidePanel` já cumpre esse papel (painel lateral sobre `Dialog` do Radix). Criar um `Sheet` paralelo violaria o critério "sem biblioteca paralela ao shadcn/ui".
- **`StatusIndicator` como novo primitivo central**: decisão para atacar a duplicação de `getStatusClass`/`getStatusLabel` encontrada em 4+ features na UI-000. A adoção efetiva nas telas fica para as tasks específicas (UI-005 em diante), não migrada aqui.
- **`Breadcrumb` primitivo vs `BreadcrumbTrail`**: mantidos separados nesta task. `components/layout/breadcrumb-trail.tsx` (implementação com mapa de rótulos pt-BR) não foi migrada para usar o novo primitivo — isso pertence ao escopo de navegação da UI-002.
- Modo escuro (`.dark`) existe no CSS mas não está conectado a nenhum `ThemeProvider` — documentado como não ativo, nenhuma ação tomada (fora do escopo).

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído com sucesso (27 rotas geradas, nenhuma quebra).
- Testes automatizados não aplicáveis: nenhuma rota, Server Action, regra de negócio ou RBAC foi alterada — apenas novos componentes de apresentação, ainda não consumidos por nenhuma tela.

## Trabalho remanescente

- Adoção dos novos componentes (`Select`/`DropdownMenu` existentes + `StatusIndicator`/`Tabs`/`Badge`/etc. novos) tela por tela, nas tasks UI-002 em diante.
- Eventual conexão de um `ThemeProvider` para modo escuro, se isso vier a ser solicitado — não é requisito da V1 atual.

## Riscos

- Nenhum: mudança aditiva, sem alteração de comportamento em telas existentes.

## Próxima task sugerida

`UI-002-app-shell-navigation.md`. Não iniciada nesta entrada do relatório — segue o fluxo sequencial autorizado.
