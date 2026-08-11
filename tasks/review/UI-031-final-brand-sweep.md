# UI-031 - Varredura Final de Consistência Visual (Rebrand) — Relatório de Implementação

## Objetivo da task

Fechar a Fase 2 do rebrand com uma varredura comercial final: ícones, raio
de borda, tokens de cor, tipografia e motion, comparando o resultado com a
paleta aprovada (esmeralda `#0EA968` → ciano `#06B6D4`).

## Varredura executada

- **Resíduo de paleta antiga** — grep por `#2f6fed`, `1746ab`, `1e3a8a`,
  `rgba(46,109,246...)`, `rgba(47,111,237...)` em todo `apps/web`: **zero
  ocorrências**.
- **Padrão antigo de ícone cinza** (`rounded-2xl border border-border/70
  bg-[color:var(--color-surface-subtle)] p-3`) reintroduzido por engano:
  **zero ocorrências**.
- **Botões de linha grandes/bordados** (`size="icon"` + `variant="outline"`
  ou `"destructive"`) em `features/*`: **zero ocorrências dentro do
  escopo permitido**. Confirmado que `features/crm/components/lead-row-actions.tsx`
  ainda usa o padrão antigo (4 ocorrências) — **intencional**, CRM está
  fora de escopo por regra do CLAUDE.md, não foi tocado em nenhuma task
  desta fase.
- **`rounded-[2rem]`** (raio antigo de auth/login): **zero ocorrências**.
- **Dark mode** — tokens de marca em `.dark` (`--color-primary`,
  `--color-primary-2`, `--chart-1/2`, `--sidebar-primary`) revisados na
  Fase 1 e mantidos consistentes; não há `ThemeProvider` ativo hoje, então
  não há verificação visual possível — os tokens estão prontos para o dia
  em que o dark mode for ligado.
- **`MetricCard`** — uso de `tone` semântico confirmado em todas as telas
  tocadas nesta fase (dashboard, Assinaturas SaaS, Catálogo comercial).

## Checklist de consistência

| Item | Status |
|---|---|
| Ícones (`size-4` em linha, `size-5` em cabeçalho/chip) | ✅ consistente nos arquivos tocados |
| Raio de borda (`1.25rem` em modal/card grande) | ✅ unificado (UI-021) |
| Tipografia (escala reduzida, tokens globais) | ✅ aplicada (UI-030) |
| Motion (sidebar, wash do header, hover de linha) | ✅ presente e respeitando `prefers-reduced-motion` |
| Avatar/marca colorida em listagens | ✅ 11 tabelas (Empresas, Assinaturas SaaS, Pacientes, Planos, Benefícios, Uso de Benefícios, Assinaturas, Pagamentos, Usuários ×2, Auditoria) |

## Verificação em navegador

Não realizada nesta task — o ambiente não tem ferramenta de browser
disponível nesta sessão. A verificação visual ficou a cargo do usuário via
dev server local, conforme já comunicado durante a Fase 2. Recomendo essa
conferência antes de mover as 11 tasks de `tasks/review` para `tasks/done`.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:tenant` — ✅ 11 cenários.
- `pnpm test:rbac` — ✅ 5 cenários.
- `pnpm test:membership` — ✅ 4 cenários.
- `pnpm test:contracts` — ✅ 5 cenários.
- `pnpm test:billing` — ✅ 7 cenários.
- `pnpm test:modules` — ✅ 4 cenários.
- `pnpm test:audit` — ✅ 8 cenários.
- `pnpm test:users` — ✅ 4 cenários.

Todas as suítes de validação listadas no `CLAUDE.md` passaram.

## Trabalho remanescente

- Verificação visual manual no navegador (ver seção acima).
- Fora do escopo desta fase, mas identificado ao longo do trabalho:
  CRM, Mensagens e Contratos continuam com o padrão visual antigo —
  aguardando decisão de negócio sobre se/quando esses módulos entram em
  escopo (hoje bloqueados pelo CLAUDE.md).

## Riscos

- Nenhum novo introduzido por esta task (somente varredura + testes).

## Próxima task sugerida

Nenhuma — Fase 2 do rebrand concluída. Aguardando aprovação humana antes
de mover as tasks UI-021–UI-031 para `tasks/done`, conforme regra do
`README-FRONTEND.md`.
