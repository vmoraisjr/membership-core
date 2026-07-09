# Task 057 - Tenant Brand Override And Clinic Identity

## Objetivo

Permitir que cada empresa cliente personalize sua identidade visual basica sem
perder a assinatura institucional da plataforma.

---

## Escopo

### 1. Identidade do tenant

Permitir cadastrar por clinica/empresa:
- nome de exibicao;
- logo em SVG;
- logo em PNG.

### 2. Aplicacao da identidade local

Quando o login for de uma empresa cliente:
- mostrar nome de exibicao no lugar de Sheep nas areas principais;
- mostrar logo da empresa no shell local;
- preservar o contexto institucional da plataforma no rodape.

### 3. Fallbacks

Quando nao houver personalizacao:
- usar a identidade padrao Sheep.

---

## Critérios de Aceite

- Cada empresa pode operar com sua propria identidade visual basica.
- A assinatura Sheep continua visivel de forma discreta.
