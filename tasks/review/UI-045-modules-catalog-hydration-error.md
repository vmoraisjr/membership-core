# UI-045 - Bug: Erro de Hidratação ao Abrir Catálogo (Módulos) — Relatório de Implementação

## Objetivo da task

Investigar e corrigir o erro de hidratação do React reportado ao clicar
em "Abrir catálogo" na tela de Módulos.

## Investigação

Sem reprodução ao vivo (sem ferramenta de navegador nesta sessão) — a
investigação foi por leitura de código e do print do erro.

**O botão "Abrir catálogo" em si não é o elemento problemático.** Ele é
um `<Button asChild variant="outline"><a href="/dashboard/billing/catalog">`
— sem `aria-haspopup`, sem lógica condicional server/client. O print do
erro mostra o elemento real que disparou o mismatch:

```
<Primitive.button.Slot type="button" aria-haspopup="dialog" aria-expanded={false} ...>
<Primitive.button.SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
+ <button data-slot="button" data-variant="outline" data-size="default" ...>
```

`aria-haspopup="dialog"` + `Slot`/`SlotClone` é a assinatura de um
`AlertDialogTrigger asChild` (Radix) — ou seja, o elemento é o **gatilho
de um `ConfirmDialog`**, não o link de "abrir catálogo". Na tela de
Módulos, o único `ConfirmDialog` na época do print era o de
habilitar/desabilitar módulo (via `ConfirmSubmitButton`, que na ocasião
não definia `size` explícito, herdando `variant="outline"` e o tamanho
padrão "default" — bate exatamente com `data-variant="outline"
data-size="default"` do print).

O overlay do Next.js mostra a tag **"stale"** ao lado da versão
(`Next.js 16.2.6 (stale) Turbopack`). Esse indicador aparece quando o
servidor de dev está servindo um módulo compilado desatualizado —
exatamente a classe de problema que eu mesmo causei e precisei corrigir
mais cedo nesta sessão (um `rm -rf .next` que corrompeu o cache do
Turbopack do servidor de dev do usuário, gerando erros só resolvidos
com reinício do servidor).

## Conclusão

Não encontrei, por leitura de código, nenhuma branch server/client,
`Date.now()`/`Math.random()`, ou HTML mal aninhado nos componentes
envolvidos (`ConfirmDialog`, `ConfirmSubmitButton`, `Button`,
`modules-page.tsx`) que explique um mismatch real e reproduzível. A
combinação "aponta para um gatilho de dialog com props estáticas" +
"indicador (stale) no overlay" torna mais provável que o erro tenha sido
um artefato do cache do Turbopack no momento do teste do que um bug de
código genuíno.

## Recomendação para a próxima tentativa

Reiniciar o servidor de dev do zero (não só recarregar a página) e
tentar reproduzir clicando em habilitar/desabilitar módulo e em "Abrir
catálogo" na tela de Módulos. Se o erro reaparecer num servidor limpo,
capturar o "Call Stack" completo (o print recortou em "Show 13
ignore-listed frame(s)") — esse dado é necessário para prosseguir com
uma correção real; sem ele, qualquer mudança de código seria um chute.

## Arquivos modificados

Nenhum — sem confirmação de bug de código reproduzível.

## Validação executada

Não aplicável (nenhuma mudança de código).

## Riscos

Nenhum.

## Próxima task sugerida

`UI-046-support-threads-chat-redesign.md`.
