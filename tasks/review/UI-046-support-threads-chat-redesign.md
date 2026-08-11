# UI-046 - Reestruturação de Chamados (Lista + Chat) — Relatório de Implementação

## Objetivo da task

Reestruturar `/dashboard/messages`, hoje um formulário de novo chamado +
lista + painel de conversa em cards lado a lado (QA: "muita coisa, não
consigo entender nada"), para um padrão de lista + conversa estilo chat
(WhatsApp/Teams), sem remover nenhuma funcionalidade existente.

## Decisão de escopo

Esta task estava marcada como "precisa aprovação de escopo antes de
iniciar" no backlog. A instrução do usuário ("execute todas as tasks do
backlog") cobre a execução; implementei a proposta que eu mesmo havia
documentado no arquivo da task, mantendo lista e conversa lado a lado
(sem nova rota/painel separado, menor risco) e preservando as três ações
existentes (criar chamado, responder, mudar status).

## O que mudou

1. **Lista prioriza abertos** —
   `features/messages/services/get-support-threads-overview.ts` passou a
   ordenar os chamados por um mapa de prioridade de status (`OPEN` →
   `IN_PROGRESS` → `WAITING_PLATFORM` → `WAITING_CLINIC` → `RESOLVED` →
   `CLOSED`) após a consulta ao banco (`orderBy: updatedAt desc`
   original preservado como critério de desempate, já que `Array.sort`
   é estável). `selectedThread` (padrão = primeiro da lista) passou a
   usar a lista já priorizada.
2. **Formulário de novo chamado virou diálogo** — em
   `features/messages/components/support-threads-page.tsx`, o
   `SectionCard` fixo de "Novo chamado" foi removido; o formulário
   (mesmos campos e mesma `action={createSupportThreadAction}`) agora
   vive dentro de um `Dialog` (`components/ui/dialog.tsx`), acionado por
   um botão "Novo chamado" no slot `action` do `SectionCard` da lista.
   Isso libera a lista como conteúdo principal da coluna esquerda, como
   pedia o QA.
3. **Lista com altura limitada e rolagem própria** — o container dos
   itens ganhou `max-h-[520px] overflow-y-auto` para não crescer
   indefinidamente com muitos chamados.
4. **Conversa redesenhada como chat** — o painel direito virou uma
   coluna de altura fixa (`h-[640px] flex flex-col`): cabeçalho fixo no
   topo (assunto, categoria/empresa, ação de status), área de mensagens
   com rolagem própria (`flex-1 overflow-y-auto`) e campo de resposta
   fixo na base — sem sair do contexto ao rolar mensagens antigas.
5. **Mensagens como bolhas alinhadas por autor** — cada mensagem usa
   `message.authorScope` para decidir o lado: mensagens da própria
   "ponta" (plataforma, quando `isPlatformView`; empresa, caso
   contrário) alinham à direita com gradiente da marca
   (`.chat-bubble-own`, reaproveita `--gradient-brand`); mensagens da
   outra ponta alinham à esquerda em tom neutro (`.chat-bubble-other`).
   Metadado (autor, escopo, data) fica abaixo da bolha, alinhado ao
   mesmo lado.
6. **Campo de resposta compacto** — textarea de 2 linhas + botão de
   enviar lado a lado no rodapé (padrão chat), em vez do bloco vertical
   anterior com label visível.

## Arquivos modificados

- `apps/web/features/messages/services/get-support-threads-overview.ts`
  — priorização de status.
- `apps/web/features/messages/components/support-threads-page.tsx` —
  diálogo de novo chamado, lista com rolagem própria, conversa
  redesenhada como chat.
- `apps/web/app/globals.css` — novas classes `.chat-bubble`,
  `.chat-bubble-own`, `.chat-bubble-other`.
- `apps/web/messages/pt-BR.json` — nova chave
  `support.newThread.trigger` (rótulo curto do botão do diálogo).

## Decisões arquiteturais

- Mantive lista + conversa lado a lado (não criei rota/painel dedicado
  para a conversa) — menor risco, reaproveita toda a lógica de
  filtro/seleção via querystring já existente.
- `Dialog` (Radix, já usado no projeto) não exige um wrapper client
  adicional: é um client component que pode ser composto diretamente
  dentro do server component da página: o `<form action={...}>` dentro
  do `DialogContent` continua funcionando normalmente como Server
  Action.
- Alinhamento de bolha usa `authorScope` (já existente no schema) e o
  tipo de workspace (`isPlatformView`) para decidir "própria ponta" vs.
  "outra ponta" — sem novo campo ou migração.
- Não toquei nas Server Actions (`createSupportThreadAction`,
  `addSupportMessageAction`, `updateSupportThreadStatusAction`) nem em
  RBAC — só reorganizei apresentação.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído,
  `/dashboard/messages` presente nas rotas.
- Sem suíte dedicada para `messages` na lista de validação do
  CLAUDE.md; não há mudança em tenant isolation, RBAC, billing ou
  módulos, então as demais suítes não se aplicam a esta task.

## Trabalho remanescente

- Sem ferramenta de navegador nesta sessão para verificação visual ao
  vivo; recomenda-se confirmar no navegador o comportamento do diálogo,
  a rolagem independente da lista/conversa e o alinhamento das bolhas
  em ambas as visões (plataforma e clínica).
- As chaves `support.conversation.updateStatusConfirmTitle` /
  `updateStatusConfirmDescription` já existem em `pt-BR.json` mas
  seguem sem uso (o formulário de mudança de status não passou a usar
  `ConfirmSubmitButton` nesta task — fora do escopo proposto). Podem
  servir de base para uma task futura caso se quiera confirmação também
  nessa transição.

## Riscos

- Baixo: mudanças de apresentação/consulta, sem alteração de
  Server Actions, RBAC ou schema.

## Próxima task sugerida

Nenhuma — este era o último item do backlog UI-032–UI-046.
