# UI-022 - Pacientes: Marca Visual e Densidade — Relatório de Implementação

## Objetivo da task

Levar o padrão validado em `clinic-table.tsx` (avatar colorido + botões de
ação de linha compactos) para a listagem de Pacientes.

## Auditoria prévia

Já feita em `docs/frontend-rebrand-audit.md`. Confirmado ao editar: os 7
botões de `patient-row-actions.tsx` não estavam todos no mesmo nível de
indentação (o botão "Ver" do branch somente-leitura tinha indentação
diferente do branch principal) — o que fez uma primeira tentativa de
`replace_all` pegar só 1 das 2 ocorrências. Corrigido manualmente logo em
seguida; vale registrar como lição para as próximas tasks desta série:
conferir com grep após cada arquivo, não confiar só no `replace_all`.

## Arquivos modificados

- `features/patients/components/patients-table.tsx` — avatar `CompanyAvatarMark`
  (iniciais + gradiente de marca, seed = `patient.id`) adicionado antes do
  nome do paciente.
- `features/patients/components/patient-row-actions.tsx` — 7 botões
  (`Eye`×2, `Pencil`, `Plus`, `CircleOff`, `RotateCcw`, `Trash2`) migrados de
  `size="icon"` + `variant="outline"`/`"destructive"` para `size="icon-sm"` +
  `variant="ghost"`; as duas ações destrutivas (`CircleOff` desativar,
  `Trash2` excluir permanentemente) usam
  `text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]`
  em vez de um botão vermelho sólido, mesmo padrão de `clinic-row-actions.tsx`.
  Os dois botões com texto visível ("Adicionar dependente", "Usar
  benefício") não foram alterados — não são o padrão "ícone solto" que a
  task mirava, e a auditoria não os havia listado como gap.

## Decisões arquiteturais

- **`CompanyAvatarMark` reutilizado para pessoas, sem criar um componente
  novo.** O cálculo de iniciais (primeira letra das duas primeiras
  palavras) já funciona igual para nome de empresa ou de paciente, e o
  nome do componente, embora genérico demais, não justifica duplicar lógica
  de hash/gradiente. Fica registrado aqui para a UI-027 (Usuários) seguir a
  mesma decisão em vez de reabrir a discussão.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído.
- `pnpm test:tenant` — ✅ 11 cenários (inclui isolamento de dados de paciente).

## Trabalho remanescente

Nenhum dentro do escopo desta task.

## Riscos

- Nenhum: mudança de apresentação, nenhuma server action alterada.

## Próxima task sugerida

`UI-023-plans-density-rollout.md`.
