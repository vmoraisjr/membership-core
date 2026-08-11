# UI-038 - Ação "Visão Rápida": Formulário Sutil

## Objetivo da task

O painel de visão rápida de uma empresa cliente (ícone de olho na
listagem de Empresas) está "sem vida". Redesenhar como um formulário
pequeno e sutil, sem cards internos, com o botão "Abrir workspace
completo" na cor primária.

## Auditoria prévia (já feita)

`features/clinic/components/clinic-quick-view-panel.tsx` — não lido em
detalhe ainda; a task inclui essa leitura como primeiro passo. Pelo
screenshot do QA: hoje é um painel lateral com vários blocos tipo card
(Conta/Operação/SaaS, Contato principal/Localização) e um botão outline
"Abrir workspace completo".

## Escopo

- Ler `clinic-quick-view-panel.tsx` e mapear a estrutura atual antes de
  alterar.
- Reduzir para um layout de formulário/ficha simples — linhas de
  label+valor, sem `Card`/borda por bloco.
- Botão "Abrir workspace completo": trocar de `variant="outline"` para
  `variant="default"` (cor primária).

## Critérios de aceite

- Painel sem cards internos, visual mais leve.
- Botão principal usa a cor da marca.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.
