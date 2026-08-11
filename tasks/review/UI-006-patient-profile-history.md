# UI-006 - Perfil e Histórico do Paciente — Relatório de Implementação

## Objetivo da task

Visão 360° do paciente: cabeçalho com identidade/status/contato/cadastro/ações; abas Visão geral, Assinaturas, Benefícios, Pagamentos e Histórico; timeline cronológica clara; sem dados de outros pacientes; tenant e RBAC preservados.

## Auditoria prévia

`PatientProfilePage` (classificada "Substituir" na UI-000) já reunia todo o conteúdo pedido — identidade, assinaturas, uso de benefícios, pagamentos, contratos e timeline — mas tudo empilhado em `SectionCard`s sequenciais, sem abas, com 5 tabelas em `<table>` HTML cru (sem `EmptyState` para nenhuma delas) e sem nenhuma ação no cabeçalho.

## Arquivos modificados

- `features/patients/components/patient-profile-page.tsx` — reestruturado em 5 abas (`Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, primeiro uso real do primitivo criado na UI-001) mapeando exatamente os nomes pedidos: Visão geral (dados cadastrais + histórico de contratos, quando existir), Assinaturas, Benefícios, Pagamentos, Histórico (timeline). As 5 tabelas HTML cruas foram substituídas por `components/ui/table.tsx`, cada uma com `EmptyState` própria quando não há registros (nenhuma tinha estado vazio antes). Cabeçalho ganhou ação "Voltar para clientes" e passou a mostrar tipo/status/telefone como kickers.
- `messages/pt-BR.json` — novas chaves: `patients.profile.tabs.*` (rótulos das 5 abas), `patients.profile.{backToList,noSubscriptions,noBenefitUsage,noInvoices}`.

## Decisões arquiteturais

- **Ação de "editar" não adicionada ao cabeçalho do perfil**: `PatientDialog` em modo edição espera uma lista de `responsibleOptions` (outros titulares, para reatribuir dependência) que a página de perfil não carrega hoje; buscar essa lista aqui duplicaria a consulta já feita em `patients-page.tsx` sem um caminho óbvio de reuso sem alterar a assinatura de `getPatientProfile()`. Como editar já está a um clique de distância (linha do paciente na listagem, UI-005), optei por não arriscar uma implementação parcial e manter o escopo desta task focado no conteúdo do próprio perfil. "Voltar para clientes" cobre o requisito de "ações" no cabeçalho de forma segura.
- **Contratos dentro da aba "Visão geral"**: a task pede exatamente 5 abas nomeadas (sem "Contratos"); como a seção de contratos só aparece quando o paciente tem contratos registrados, ela foi mantida como um card adicional dentro de "Visão geral" em vez de criar uma 6ª aba fora do escopo pedido.
- Nenhuma alteração em `get-patient-profile.ts` — o serviço já retornava todos os dados necessários (incluindo `createdAt`/`subscriptions` usados na UI-005), sem nenhuma nova consulta.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 27 rotas geradas.
- **Verificação em navegador (Playwright)**: autenticado como `owner+nortex-medical@membership-core.local`, naveguei da listagem até o perfil de "Ana Souza" e alternei entre as 5 abas. Todas trocam de conteúdo corretamente (estado ativo destacado em azul), tabelas renderizam com dados reais (inclusive uma cobrança em atraso e uma paga), histórico de contratos aparece na Visão geral, 0 erros de console em todas as abas verificadas.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Baixo: mudança de apresentação sobre dados já existentes; nenhuma query, Server Action ou RBAC alterados. O componente `Tabs` é client-side (`"use client"` já embutido no primitivo), mas a página em si permanece um Server Component — a troca de aba é puramente visual, sem refetch.

## Próxima task sugerida

`UI-007-patient-form.md`.
