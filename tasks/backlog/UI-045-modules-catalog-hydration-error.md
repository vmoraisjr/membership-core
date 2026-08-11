# UI-045 - Bug: Erro de Hidratação ao Abrir Catálogo (Módulos)

## Objetivo da task

Investigar e corrigir o erro de hidratação do React reportado ao clicar
em "Abrir catálogo" na tela de Módulos.

## Auditoria prévia (já feita)

Mensagem do Next.js: "Hydration failed because the server rendered HTML
didn't match the client", apontando para `components/ui/button.tsx:58`
(`Button`, dentro do `Slot`/`SlotClone` do Radix). O botão em questão
(`features/modules/components/modules-page.tsx:182-188`) é:

```tsx
<Button asChild variant="outline">
  <a href="/dashboard/billing/catalog">...</a>
</Button>
```

Por leitura de código não é possível confirmar a causa exata — mismatch
de hidratação normalmente vem de conteúdo calculado diferente entre
servidor e cliente (data, `Math.random`, `window`, extensão de navegador
interferindo no HTML antes do React carregar). Nenhum desses padrões
óbvios aparece neste trecho especificamente, então a causa pode estar em
outro lugar da árvore (um componente pai) e o erro só aponta o primeiro
elemento onde o React percebeu a diferença.

## Escopo

- Reproduzir localmente com o overlay de erro do Next.js aberto, expandir
  o "Call Stack" completo (o print no QA mostra só parte) para achar o
  componente pai real.
- Descartar extensão de navegador como causa (testar em aba anônima /
  outro navegador) antes de assumir que é bug de código.
- Se confirmado bug de código: corrigir a fonte do mismatch (conteúdo
  dependente de `Date.now()`/locale/estado client-only renderizado sem
  guarda).

## Critérios de aceite

- Erro não reproduz mais ao clicar em "Abrir catálogo" a partir de
  Módulos.
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.
- `pnpm test:modules` sem regressão.

## Restrições

- Não "resolver" silenciando o erro (ex. `suppressHydrationWarning`) sem
  entender a causa — isso mascara o sintoma, não corrige.
