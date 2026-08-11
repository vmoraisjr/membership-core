# UI-036 - Reconfirmar Botão de Colapsar da Sidebar

## Objetivo da task

O QA reporta o botão de colapsar ainda sobreposto/incompleto. Uma correção
já foi aplicada numa rodada anterior (z-index do botão subiu de `z-10`
para `z-30`, acima do `z-20` do topbar; a sidebar deixou de usar
`h-screen` fixo e passou a esticar com o conteúdo via um wrapper
`sticky` interno). Esta task é para **confirmar visualmente** se o
problema persiste no build atual antes de investigar mais.

## Auditoria prévia (já feita)

Ver `docs/qa-ux-review-2026-08.md`, item 4.1. Estado atual do código
(`app/globals.css`, classes `.sidebar-collapse-toggle` e
`.app-shell-header`; `components/layout/dashboard-sidebar.tsx`) já reflete
o fix. Não encontrei, por leitura de código, nenhum outro elemento com
z-index maior que possa estar cobrindo o botão.

## Escopo

1. Rodar o app localmente, abrir a tela Visão geral, verificar se o botão
   aparece completo (círculo inteiro, não cortado) tanto no estado normal
   quanto com a sidebar colapsada.
2. **Se já estiver correto**: fechar a task como "não reproduzido após
   fix anterior", sem alteração de código.
3. **Se ainda estiver quebrado**: investigar com as ferramentas de dev do
   navegador (inspecionar elemento, computed z-index/overflow) antes de
   tentar outra correção — não repetir a mesma tentativa (z-index) sem
   entender a causa nova.

## Critérios de aceite

- Confirmação visual documentada no relatório da task (com ou sem
  necessidade de código novo).

## Restrições

- Não alterar `.sidebar-collapse-toggle`/`.app-shell-sidebar` "no escuro"
  — só depois de confirmar que o problema é real no build atual.
