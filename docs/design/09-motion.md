# Sheep Motion

## 1. Filosofia

Motion no Sheep deve ajudar o usuário a entender mudanças de estado.

Não deve existir para chamar atenção.

A animação deve ser:

- Rápida
- Suave
- Discreta
- Funcional
- Previsível

## 2. Princípio

> Motion deve reduzir incerteza, não criar espetáculo.

## 3. Durações

```css
--duration-instant: 0ms;
--duration-fast: 120ms;
--duration-normal: 180ms;
--duration-slow: 240ms;
```

## 4. Uso recomendado

```txt
0ms   - mudanças instantâneas, estados de formulário
120ms - hover, focus, press
180ms - dropdown, tooltip, toast, pequenas transições
240ms - side panel, dialog, sidebar
```

Evitar animações acima de 300ms.

## 5. Easing

```css
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
```

## 6. Hover

Hover deve ser sutil.

Exemplo:

```txt
background muda levemente
border pode ganhar contraste
ícone pode mudar cor
shadow raramente aumenta
```

Evitar:

- Escala exagerada
- Glow forte
- Mudança brusca de cor
- Movimento desnecessário

## 7. Focus

Focus deve ser claro e acessível.

Usar focus ring azul suave.

```css
box-shadow: var(--shadow-focus);
```

O focus não deve ser removido.

## 8. Sidebar

Sidebar expanded/collapsed:

```txt
Duration: 240ms
Easing: ease-standard
```

Comportamento:

- Largura anima suavemente
- Texto aparece/desaparece com fade curto
- Ícones permanecem estáveis
- Evitar layout shift agressivo

## 9. Side Panel

Side panel:

```txt
Duration: 240ms
Easing: ease-out
Entrada: direita para esquerda
Saída: esquerda para direita
Overlay: opcional e discreto
```

Regra:

O painel deve preservar contexto.

Não deve parecer um modal pesado.

## 10. Dropdown

Dropdown:

```txt
Duration: 180ms
Entrada: fade + leve translateY
Saída: fade
```

Evitar dropdowns com grandes deslocamentos.

## 11. Dialog

Dialogs devem ser raros.

Quando usados:

```txt
Duration: 220ms
Entrada: fade + scale 98% para 100%
Saída: fade curto
```

Usar dialog para:

- Confirmações críticas
- Ações destrutivas
- Decisões que interrompem fluxo com justificativa

Evitar dialog para edição comum.

## 12. Toast

Toast:

```txt
Duration entrada: 180ms
Duration saída: 180ms
Posição: bottom-right ou top-right
```

Toast deve ser calmo e objetivo.

Exemplo:

```txt
Alterações salvas.
```

ou

```txt
Convite enviado.
```

Erro:

```txt
Não foi possível enviar o convite. Tente novamente.
```

## 13. Loading

Estados de carregamento devem ser discretos.

Preferir:

- Skeletons
- Loading inline
- Botão com spinner pequeno
- Estados parciais

Evitar:

- Tela inteira bloqueada sem necessidade
- Spinners grandes
- Mensagens vagas

## 14. Skeleton

Skeleton deve seguir a estrutura real do conteúdo.

```txt
Cards: blocos
Tabelas: linhas
Painéis: título + seções
Formulários: labels + campos
```

## 15. Transições de estado

Estados devem mudar com suavidade:

```txt
default -> hover
hover -> active
loading -> success
empty -> content
view -> edit
```

A transição mais importante do Sheep é:

```txt
Visualizar -> Editar -> Salvar -> Visualizar
```

Essa mudança deve acontecer no próprio contexto sempre que possível.

## 16. Redução de movimento

Respeitar `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 17. Quando não usar motion

Não usar motion para:

- Decorar
- Impressionar
- Disfarçar lentidão
- Chamar atenção sem motivo
- Criar sensação de jogo
- Fazer elementos importantes demorarem a aparecer

## 18. Regra final

Se a animação não ajuda o usuário a entender o que mudou, ela não deve existir.
