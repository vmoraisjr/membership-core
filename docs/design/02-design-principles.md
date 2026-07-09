# Sheep Design Principles

## 1. Cognitive First Design

Toda decisão de interface deve reduzir a carga cognitiva do usuário.

O usuário não deve precisar pensar demais para entender:

- Onde está
- O que precisa fazer
- Qual ação é mais importante
- O que aconteceu depois de uma ação
- Como corrigir um erro

## 2. O usuário não deve precisar aprender a interface

A interface deve ser previsível desde o primeiro contato.

Isso significa:

- Botões principais sempre no mesmo lugar
- Padrões de formulário consistentes
- Filtros com comportamento previsível
- Tabelas com ações padronizadas
- Feedbacks claros
- Menus simples
- Poucos caminhos para a mesma ação

## 3. O Sheep nunca faz perguntas cuja resposta ele já conhece

Se o sistema já possui o contexto, ele não deve pedir a mesma informação novamente.

Exemplo:

Se o usuário está dentro do painel de um cliente e clica em “Nova assinatura”, o cliente já deve vir selecionado.

## 4. Toda tela deve responder: “O que devo fazer agora?”

Cada tela precisa ter uma intenção clara.

Evitar telas que sejam apenas depósitos de dados.

O dashboard, por exemplo, não deve ser um relatório. Deve ser um painel de decisões.

## 5. Complexidade progressiva

O Sheep deve mostrar primeiro o essencial.

Informações avançadas devem existir, mas não competir com a ação principal.

Regra:

```txt
Essencial primeiro.
Detalhe depois.
Avançado quando necessário.
```

## 6. Continuidade acima de navegação

Sempre que possível, manter o contexto visível.

Preferir painéis laterais e workspaces a navegação profunda entre páginas.

Exemplo:

- Lista de clientes permanece visível.
- O detalhe do cliente abre ao lado.
- O usuário não precisa “voltar” para continuar trabalhando.

## 7. O software acompanha o negócio. Não o contrário.

O Sheep deve se adaptar a diferentes segmentos sem parecer genérico.

Isso exige:

- Linguagem neutra
- Componentes flexíveis
- Temas configuráveis
- Módulos independentes
- Arquitetura escalável

## 8. A inovação deve aparecer na experiência

Não usar efeitos visuais apenas para parecer moderno.

Inovação no Sheep significa:

- Menos cliques
- Menos campos
- Mais contexto
- Mais automação
- Mais previsibilidade
- Menos esforço mental

## 9. Nenhuma tela entra sem fortalecer o Design System

Sempre que uma tela exigir um novo padrão visual ou funcional, avaliar se aquilo deve virar componente reutilizável.

Perguntas obrigatórias:

- Esse padrão será usado em outro lugar?
- Ele reduz carga cognitiva?
- Ele melhora consistência?
- Ele substitui uma solução improvisada?

## 10. Clareza vence beleza

Se houver conflito entre beleza e facilidade de uso, a facilidade vence.

O Sheep pode ser elegante, mas nunca às custas de clareza.

## 11. Poucos elementos, muito propósito

Cada elemento precisa justificar sua presença.

Evitar:

- Cards decorativos
- Gráficos sem decisão associada
- Ícones sem texto em ações importantes
- Badges em excesso
- Modais desnecessários
- Alertas repetitivos

## 12. Feedback calmo

O sistema deve informar sem assustar.

Mesmo em erro, a linguagem deve transmitir segurança.

Exemplo:

```txt
Encontramos um problema ao salvar as alterações. Nenhuma informação foi perdida.
```

## 13. Workspaces, não CRUDs

O Sheep não deve parecer uma sequência de telas de cadastro.

O usuário trabalha dentro de contextos.

Exemplo:

```txt
Cliente Workspace
  Resumo
  Assinaturas
  Benefícios
  Financeiro
  Histórico
  Comunicação
```

O usuário não “edita um registro”. Ele trabalha no contexto daquele cliente.
