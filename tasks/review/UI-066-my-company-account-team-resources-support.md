# UI-066 — Minha Empresa: Conta, Equipe, Recursos e Suporte — Relatório de Implementação

## Entrega

- `/dashboard/minha-empresa` já encaminhava para Perfil/Assinatura,
  Equipe, Recursos e Suporte desde a UI-059, mas cada destino era uma
  tela isolada, sem navegação em comum. Foi criado `MyCompanyTabs`
  (`features/clinic/components/my-company-tabs.tsx`) — uma faixa de abas
  única (Perfil, Assinatura Sheep, Equipe, Recursos, Suporte) usando
  `minhaEmpresaUrl` — e reutilizada nas quatro páginas já existentes
  (`CompanyProfilePage`, `UsersPage`, `ModulesPage`,
  `SupportThreadsPage`), cada uma **apenas no seu ramo de renderização
  para a clínica**, sem tocar nos ramos que essas mesmas páginas
  compartilham com a plataforma (Administração, Módulos comerciais,
  Chamados globais).
- **Perfil**: identidade editável e dados cadastrais somente leitura
  continuam separados como antes; "Abrir chamado cadastral" agora leva
  direto para Suporte com a categoria **Cadastro** pré-selecionada no
  formulário de novo chamado (antes o formulário sempre abria fixo em
  "Solicitação", perdendo o motivo).
- **Assinatura Sheep**: sem mudanças de lógica — continua reaproveitando
  integralmente `CompanySubscriptionTab` (PAY-002/PAY-003): checkout,
  portal, pausa, retomada e cancelamento.
- **Equipe**: `UsersPage` (a mesma gestão local de usuários já usada em
  `/dashboard/users`) passou a ser alcançável só pela aba, com convite,
  papel e status sob as mesmas guardas de sempre — nenhum usuário de
  empresa precisa mais conhecer `/dashboard/users` diretamente (a rota
  legada já redireciona, herdado da UI-059).
- **Recursos**: renomeado de "Módulos" para "Recursos" (título da página e
  item da sidebar) — módulos continuam informativos, sem virar item
  principal de operação, exatamente como já era.
- **Suporte**: `SupportThreadsPage` no ramo da clínica (não confundir com
  o ramo `scope: "company"`, usado pelo Owner para inspecionar uma
  empresa específica) ganhou a mesma faixa de abas.
- Linguagem: "Minha empresa" e "Assinatura Sheep" já eram os únicos
  termos usados nessas telas; nenhuma ambiguidade com a assinatura do
  cliente/paciente foi encontrada (essa usa sempre "Assinatura" no
  singular, sem o qualificador "Sheep", dentro do workspace do cliente).

## Correções incidentais

- A rota legada `/dashboard/company` (fallback para usuários de
  plataforma) ainda passava os valores antigos `"perfil"`/`"assinatura"`
  para `CompanyProfilePage`, que agora espera `"profile"`/`"subscription"`
  — corrigido; o TypeScript teria pego isso na build de qualquer forma,
  mas foi corrigido antes por completude.

## Segurança e disponibilidade

- Nenhuma mudança de permissão, gateway de pagamento ou regra de módulo.
- Nenhuma das quatro páginas mudou sua guarda de acesso: Perfil/Assinatura
  continuam em `renderClinicScopedPage` (não a guarda operacional), então
  Minha empresa e Suporte seguem alcançáveis por menu e por URL mesmo com
  a assinatura SaaS pausada, suspensa, em atraso ou cancelada — verificado
  ao vivo suspendendo a assinatura de teste.

## Validação

- `pnpm --dir apps/web typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm --dir apps/web build` — passou.
- `pnpm test:users` — 4 cenários passaram.
- `pnpm test:modules` — 4 cenários passaram.
- `pnpm test:billing` — 14 cenários passaram.
- `pnpm test:tenant` — 11 cenários passaram.
- `pnpm test:rbac` — 5 cenários passaram.
- `pnpm test:messages` (regressão de Chamados) — 2 cenários passaram.
- Playwright (build de produção, roteiro descartável após validação):
  faixa de 5 abas visível e navegável em Minha empresa; convite de
  usuário concluído na aba Equipe; "Abrir chamado cadastral" chega ao
  formulário de novo chamado com categoria Cadastro pré-selecionada, e o
  chamado criado aparece na lista; retorno de checkout
  (`?checkout=success`) mostra "Pagamento confirmado"; com a assinatura
  SaaS forçada para `SUSPENDED`, a sidebar ainda mostra Minha empresa e
  Chamados, enquanto Clientes (rota operacional) fica oculto — assinatura
  restaurada para `ACTIVE` ao final do teste.

## Próxima task

UI-067 — Empresa: Retirada de Caminhos Legados e Regressão de Permissões.
