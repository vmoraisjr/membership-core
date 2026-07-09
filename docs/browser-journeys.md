# Browser Journeys

## Objetivo

Criar uma base real de testes browser-level para validar fluxos criticos da
plataforma Sheep e das empresas clientes.

## Stack atual

- `Playwright` como camada de automacao de navegador.
- `apps/web/scripts/seed-browser-journeys.mjs` para preparar um banco isolado
  e deterministico antes da execucao.
- `apps/web/playwright.config.mjs` para subir a aplicacao localmente e apontar
  os testes para `http://127.0.0.1:3000`.

## Scripts

Na raiz:

- `pnpm e2e:web:seed`
- `pnpm test:e2e:web`

No app web:

- `pnpm e2e:seed`
- `pnpm test:e2e`
- `pnpm test:e2e:headed`

## Credenciais semeadas

- Plataforma: `owner+workspace@membership-core.local` / `ChangeMe123!`
- Empresa com primeiro acesso: `first-access@browser-journeys.local` /
  `TempClinic123!`
- Empresa pronta para operacao: `operations@browser-journeys.local` /
  `ClinicReady123!`

## Jornadas iniciais

- `auth-and-platform.spec.mjs`
  - login da plataforma;
  - criacao de empresa;
  - fluxo de primeiro acesso;
  - solicitacao neutra de recuperacao de senha.
- `clinic-operations.spec.mjs`
  - criacao de plano;
  - criacao de cliente;
  - criacao de assinatura;
  - abertura de chamado pela empresa e validacao na visao da plataforma.

## Observacao local

Se o ambiente ainda nao tiver o pacote do Playwright e os navegadores
instalados, a fundacao fica pronta no repositório, mas a execucao browser-level
dependera da instalacao local correspondente.
