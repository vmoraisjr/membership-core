# Platform Admin Checklist

## Estrutura

- Toda página principal da Plataforma usa `PageHeader`.
- Ações primárias aparecem uma vez por tela e ficam fáceis de localizar.
- Filtros ficam no topo da área operacional e antes da tabela.
- Tabelas usam `DataTableContainer` sempre que possível.

## Navegação

- A sidebar mantém apenas atalhos coerentes com o contexto da Plataforma.
- Estados ativos e recolhidos permanecem legíveis.
- Itens exclusivos da Plataforma não aparecem para clínicas.

## Formulários

- Formulários longos usam `FormSection`.
- Campos críticos têm `field-help` explicando impacto.
- Máscaras BR de CNPJ, telefone, CEP e UF são aplicadas quando relevante.
- Edição detalhada prefere `SidePanel` a modal central.

## Operação

- Filas de assinaturas e pagamentos mostram prioridade antes da tabela.
- Ações operacionais usam ícones claros e rótulos objetivos.
- Empty states orientam a próxima ação do usuário.

## Governança

- Usuários internos da Plataforma usam painel lateral para criar e editar.
- Auditoria resume a linha e permite abrir payload completo.
- Exportação CSV continua disponível na auditoria.

## Visual

- Cards, painéis e tabelas usam tokens do design system.
- Azul é usado como apoio, não como preenchimento dominante.
- Espaçamento, bordas e sombras seguem os padrões globais.
