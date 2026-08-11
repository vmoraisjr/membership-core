# UI-028 - Auditoria e Módulos: Marca Visual e Controles — Relatório de Implementação

## Objetivo da task

Fechar a cauda longa das telas administrativas menores: Auditoria (marca
visual na tabela) e Módulos (controles nativos + tipografia de estatística).

## Auditoria prévia — correção de achado

Os 2 `<input>` de `features/modules/components/modules-page.tsx` (linhas
478 e 502) apontados no `docs/frontend-rebrand-audit.md` são
`type="hidden"` — carregam `moduleKey` para as ações de habilitar/desabilitar
módulo, não são um controle visível. Não é um gap de UI e não há nada para
migrar; conferido com grep antes de qualquer alteração para não "consertar"
um input invisível sem necessidade. Registrando aqui porque o achado
original (herdado da varredura automática) estava impreciso.

## Arquivos modificados

- `features/audit-log/components/audit-log-table.tsx` — `CompanyAvatarMark`
  (sem `seed` explícito, usa o próprio `log.actor` como nome/seed — o log
  não expõe o id do usuário ator, só a string já formatada) antes do nome
  do ator na coluna "Usuário".

## Trabalho remanescente

Os 4 tiles de estatística de `modules-page.tsx` (`text-2xl`/`text-3xl`,
linhas 104, 119, 135, 152) ficam para a UI-030 (escala tipográfica), como
já estava planejado — mudar a fonte deles isoladamente antes da decisão de
escala global geraria retrabalho.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm test:audit` — ✅ 8 cenários.
- `pnpm test:modules` — ✅ 4 cenários.

## Riscos

- Nenhum: mudança de apresentação, nenhuma server action alterada.

## Próxima task sugerida

`UI-029-native-controls-cleanup.md`.
