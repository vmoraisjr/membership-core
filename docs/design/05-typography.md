# Sheep Typography

## 1. Filosofia tipográfica

A tipografia é um dos principais elementos de identidade do Sheep.

A interface deve ser reconhecida pela clareza, ritmo e legibilidade antes mesmo de ser reconhecida pela cor.

## 2. Fonte principal

Recomendação para UI:

```txt
Atkinson Hyperlegible Next
```

Motivo:

- Excelente legibilidade
- Diferenciação clara entre caracteres
- Acessibilidade
- Boa leitura em tabelas
- Boa leitura em formulários
- Alinhada ao princípio “não precisei aprender a usar”

Fallback:

```css
font-family: "Atkinson Hyperlegible Next", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

## 3. Fonte secundária

Recomendação para marketing, landing pages e materiais institucionais:

```txt
Plus Jakarta Sans
```

Uso:

- Site público
- Apresentações
- Materiais comerciais
- Documentos de marca
- Headlines institucionais

## 4. Pesos

Usar poucos pesos.

```txt
400 Regular
500 Medium
600 Semibold
700 Bold
```

Evitar:

- 300 Light
- 800 ExtraBold
- 900 Black

O Sheep deve parecer preciso, não dramático.

## 5. Escala tipográfica

```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 30px;
--font-size-4xl: 36px;

--line-height-xs: 16px;
--line-height-sm: 20px;
--line-height-md: 24px;
--line-height-lg: 28px;
--line-height-xl: 30px;
--line-height-2xl: 32px;
--line-height-3xl: 38px;
--line-height-4xl: 44px;
```

## 6. Estilos semânticos

### Page Title

```txt
Size: 30px
Line-height: 38px
Weight: 600
```

Uso:

- Título principal da página
- Dashboard
- Workspace principal

### Section Title

```txt
Size: 20px
Line-height: 30px
Weight: 600
```

Uso:

- Seções internas
- Cards principais
- Agrupamentos

### Card Title

```txt
Size: 16px
Line-height: 24px
Weight: 600
```

Uso:

- Títulos de cards
- Painéis laterais
- Resumos

### Body

```txt
Size: 14px ou 16px
Line-height: 20px ou 24px
Weight: 400
```

Uso:

- Texto principal
- Formulários
- Conteúdo geral

### Label

```txt
Size: 14px
Line-height: 20px
Weight: 500
```

Uso:

- Labels de campos
- Filtros
- Pequenas instruções

### Caption

```txt
Size: 12px
Line-height: 16px
Weight: 400
```

Uso:

- Ajuda
- Metadados
- Datas
- Status secundário

## 7. Regras

- Não usar textos longos em caixa alta.
- Não usar fontes decorativas na interface.
- Não usar mais de dois pesos na mesma área.
- Evitar títulos grandes sem necessidade.
- Preferir clareza a impacto visual.
- Tabelas devem priorizar leitura rápida.
- Labels devem ser objetivas.
