# Sheep Layout and Grid

## 1. Filosofia

O layout do Sheep deve ser previsível.

O usuário nunca deve se perguntar:

```txt
Onde fica isso?
```

## 2. Estrutura principal

O layout base usa:

- Sidebar recolhível
- Header simples
- Área de conteúdo
- Breadcrumb em telas internas
- Painéis laterais para entidades
- Páginas completas para módulos

## 3. Modelo principal

```txt
┌───────────────────────────────────────────────┐
│ Header                                        │
├───────────────┬───────────────────────────────┤
│ Sidebar       │ Content                       │
│               │                               │
│               │                               │
└───────────────┴───────────────────────────────┘
```

## 4. Sidebar

A sidebar deve ser recolhível.

Estados:

```txt
expanded
collapsed
```

Expanded:

- Mostra símbolo
- Mostra nome Sheep
- Mostra labels dos itens

Collapsed:

- Mostra símbolo
- Mostra apenas ícones
- Tooltip ao passar o mouse

## 5. Estrutura de navegação

Menu principal v1:

```txt
Home
Operação
Relacionamento
Financeiro
Configurações
```

Subitens esperados:

```txt
Operação
  Clientes
  Assinaturas
  Planos
  Benefícios

Relacionamento
  Campanhas
  Comunicação
  Fidelização

Financeiro
  Cobranças
  Pagamentos
  Relatórios

Configurações
  Empresa
  Usuários
  Permissões
  Preferências
```

## 6. Header

O header deve ser simples.

Conteúdo recomendado:

- Breadcrumb ou título contextual
- Busca global futura
- Ações rápidas
- Perfil do usuário
- Alternância de clínica/empresa, quando aplicável

Evitar:

- Header cheio
- Muitos botões
- Gráficos
- Notificações agressivas

## 7. Breadcrumb

Usar breadcrumb em telas internas.

Exemplo:

```txt
Home > Operação > Clientes > Maria Souza
```

Objetivo:

- Reduzir sensação de perda
- Mostrar contexto
- Evitar dependência do botão voltar

## 8. Content width

Largura recomendada:

```txt
Dashboard: fluido
Formulários: máximo 720px
Detalhes de entidade: 960px a 1200px
Relatórios: fluido
Configurações: máximo 960px
```

## 9. Workspaces

O Sheep deve priorizar workspaces em vez de CRUD tradicional.

Exemplo:

```txt
Clientes Workspace
  Lista
  Painel do cliente
    Resumo
    Assinaturas
    Benefícios
    Financeiro
    Histórico
```

## 10. Side Panels

Entidades devem abrir preferencialmente em painel lateral.

Usar painel lateral para:

- Cliente
- Assinatura
- Plano
- Benefício
- Cobrança
- Pagamento
- Convite
- Usuário

Usar página completa para:

- Dashboard
- Relatórios
- Analytics
- Configurações avançadas
- Automações
- Onboarding
- Fluxos complexos

## 11. Dashboard

O dashboard do Sheep não é um relatório.

Ele responde:

```txt
O que precisa da minha atenção hoje?
```

Estrutura recomendada:

```txt
Saudação
Ações ou pendências importantes
Atalhos principais
Indicadores
Gráficos
Listas recentes
```

Indicadores nunca devem vir antes de ações críticas.

## 12. Formulários

Formulários devem ser curtos e contextuais.

Regras:

- Pedir apenas o necessário
- Agrupar campos relacionados
- Mostrar ajuda no contexto
- Validar cedo
- Evitar etapas desnecessárias
- Não pedir dados já conhecidos

## 13. Tabelas

Tabelas devem ser limpas, legíveis e acionáveis.

Toda tabela deve prever:

- Busca
- Filtro
- Ordenação
- Estado vazio
- Estado carregando
- Estado de erro
- Ação primária contextual
- Densidade confortável e compacta

## 14. Empty states

Estados vazios devem orientar ação.

Exemplo:

```txt
Nenhum plano cadastrado ainda.
Crie o primeiro plano para começar a vender assinaturas.
[ Criar plano ]
```

Evitar empty states genéricos.
