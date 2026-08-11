# UI-046 - Reestruturação de Chamados (Lista + Chat)

## ⚠️ Precisa aprovação de escopo antes de iniciar

Esta é uma mudança de fluxo/UX, não uma tarefa de densidade visual como
as demais. Confirmar a proposta abaixo com o usuário antes de implementar.

## Objetivo da task

Reestruturar a tela de Chamados (`/dashboard/messages`), hoje um
formulário de novo chamado + lista + painel de conversa lado a lado (tudo
em cards, segundo o QA "muita coisa, não consigo entender nada"), para um
padrão de lista + conversa estilo chat (WhatsApp/Teams).

## Auditoria prévia (já feita)

`features/messages/components/support-threads-page.tsx` — layout atual:
coluna esquerda com formulário de novo chamado (`SectionCard`) empilhado
sobre a lista de chamados (outro `SectionCard`, filtros + lista), coluna
direita com o painel de conversa (mensagens + resposta). Já recebeu
avatar colorido por chamado numa correção anterior, mas a estrutura geral
não mudou.

## Proposta de escopo (a validar)

- **Lista de chamados**: prioriza abertos no topo (ordenar por status
  antes de data, ou seção separada "Abertos" vs "Resolvidos"), com
  filtros compactos (categoria, status, empresa) — não precisa de
  formulário de novo chamado ocupando a mesma tela; pode virar uma ação
  ("+ Novo chamado") que abre um formulário à parte (dialog/painel).
- **Conversa**: ao clicar num chamado, abre a conversa completa num
  painel dedicado (pode ser a coluna direita atual, mas redesenhada como
  thread de chat — bolhas de mensagem alinhadas por autor, campo de
  resposta fixo embaixo) em vez do bloco de cards atual.
- Definir se a lista + conversa ficam lado a lado (como hoje,
  redesenhado) ou se a conversa abre em painel separado
  (`SidePanel`/rota própria) — impacta bastante o layout, decidir antes
  de implementar.

## Critérios de aceite (dependem da decisão de escopo acima)

- Lista de chamados prioriza abertos, com filtros visíveis e compactos.
- Conversa em formato de chat, legível, com ações de mudança de status
  acessíveis sem sair do contexto.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.

## Restrições

- Não é módulo de "comunicação" excluído pelo CLAUDE.md — é o sistema de
  tickets operacionais plataforma↔clínica, já confirmado em uso real (ver
  `docs/qa-ux-review-2026-08.md`).
- Não remover nenhuma funcionalidade existente (criar chamado, responder,
  mudar status) — só reorganizar como aparece.
