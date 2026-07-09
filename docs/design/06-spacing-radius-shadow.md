# Sheep Spacing, Radius and Shadow

## 1. Filosofia

O Sheep deve parecer claro, leve e organizado.

Espaçamento é uma ferramenta de redução de carga cognitiva.

A interface deve respirar sem desperdiçar espaço.

## 2. Escala de espaçamento

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

## 3. Uso recomendado

```txt
4px  - ajustes finos, distância entre ícone e texto
8px  - grupos pequenos
12px - inputs, botões, gaps internos
16px - espaçamento base entre elementos
24px - seções próximas
32px - blocos principais
48px - grandes divisões
64px - áreas institucionais ou páginas vazias
```

## 4. Densidade

A densidade padrão é confortável.

Tabelas podem ter modo:

```txt
comfortable
compact
```

A interface geral não deve ser compacta por padrão.

## 5. Radius

O Sheep usa cantos levemente arredondados.

```css
--radius-xs: 4px;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 999px;
```

## 6. Uso de radius

```txt
Inputs: radius-md
Buttons: radius-md
Cards: radius-lg
Panels: radius-xl
Badges: radius-full
Avatars: radius-full
Tables: radius-lg no container
Dropdowns: radius-lg
```

## 7. Regra

Evitar cantos muito arredondados.

O Sheep deve parecer amigável, mas não infantil.

## 8. Sombras

Sombras devem ser sutis.

O objetivo é indicar camada, não chamar atenção.

```css
--shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
--shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
--shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
--shadow-lg: 0 16px 40px rgba(15, 23, 42, 0.12);
```

## 9. Uso de sombras

```txt
shadow-xs: elementos discretos
shadow-sm: cards simples
shadow-md: dropdowns e side panels
shadow-lg: dialogs e overlays importantes
```

## 10. Regra de elevação

A interface deve ter poucas camadas.

Ordem:

```txt
Base
Card
Dropdown
Side Panel
Dialog
Toast
```

Evitar empilhar muitos overlays.
