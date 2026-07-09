# Task 048 - Platform Commercial Governance Gap Closure

## Objetivo

Fechar as lacunas que ainda impedem o owner da plataforma de operar o SaaS com
clareza, sem misturar gestao da plataforma com gestao de uma clinica.

---

## Escopo

### 1. Revisar a visao do owner da plataforma

Garantir que o owner global veja apenas:
- clinicas;
- assinaturas SaaS;
- pagamentos SaaS;
- usuarios da plataforma;
- auditoria global;
- chamados plataforma <-> cliente.

### 2. Remover residuos de contexto de clinica da visao global

Revisar dashboards, contadores, labels, rotas e cards que ainda mostrem dados
como se o owner global estivesse dentro de uma clinica.

### 3. Consolidar a navegacao global

Validar que o menu do owner global fique focado em governanca da plataforma, sem
mostrar modulos inativos ou sessoes operacionais da clinica.

---

## Fora de Escopo

- Rebranding visual completo.
- Refatoracao ampla de dominio.

---

## Critérios de Aceite

- O owner global nao enxerga dados operacionais de uma clinica como se fossem
  seus.
- A navegacao da plataforma fica objetiva e coerente com governanca SaaS.
- Nenhuma tela global depende de contexto de tenant local para funcionar.
