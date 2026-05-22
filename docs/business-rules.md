1. MULTI-TENANT
Conceito

Cada clínica é isolada.

Regras principais
cada clínica possui seus próprios usuários
cada clínica possui seus próprios pacientes
cada clínica possui seus próprios planos
dados nunca se misturam entre tenants
admins do sistema conseguem visualizar todos tenants

Decisões futuras
subdomínios por clínica? sim
branding personalizado? sim
planos da plataforma? sim

2. USUÁRIOS E ROLES
Roles iniciais
SystemAdmin

Acesso total plataforma.

ClinicAdmin

Gerencia clínica.

Pode:

criar planos
editar benefícios
gerenciar pacientes
visualizar pagamentos
Receptionist

Operacional.

Pode:

consultar paciente
validar uso
visualizar assinatura
Financial

Financeiro.

Pode:

visualizar pagamentos
registrar pagamentos
consultar inadimplência
Patient

Usuário final.

Pode:

visualizar plano
visualizar benefícios
acompanhar histórico
acessar QR code

Regras importantes
usuário pertence a um tenant
paciente pode possuir dependentes
paciente pode ter múltiplas assinaturas futuramente? (decidir depois)

3. PLANOS (Membership Plans)
Conceito

Plano comercial oferecido pela clínica.

Campos principais
nome
descrição
valor
periodicidade
status
Regras
plano pode possuir múltiplos benefícios
plano pode limitar dependentes
plano pode ser ativado/desativado
plano pode possuir carência futuramente
plano pertence a uma clínica

Decisões futuras
upgrades/downgrades
múltiplas categorias
fidelidade mínima

4. BENEFÍCIOS

Esse é o coração do sistema.

Conceito

Tudo que o assinante pode consumir.

Tipos possíveis
gratuidade
desconto percentual
desconto fixo
quantidade limitada

Exemplos
2 consultas grátis/mês
20% exames

Regras principais
benefício pertence a um plano
benefício possui limite
benefício possui periodicidade
benefício pode expirar
benefício pode exigir validação manual
Talvez a regra MAIS importante
Frequência do benefício

Exemplo:

2 usos por mês
1 uso por ano
uso ilimitado

Isso impacta MUITO modelagem.

5. ASSINATURAS (Subscriptions)
Conceito

Vínculo do paciente com um plano.

Status possíveis
active
pending
overdue
cancelled
expired

Regras principais
assinatura pertence a um paciente
assinatura pertence a um plano
assinatura possui validade
assinatura possui histórico
assinatura pode possuir dependentes

Regras financeiras
assinatura pode ser suspensa por inadimplência
assinatura pode possuir renovação manual inicialmente

6. DEPENDENTES
Conceito

Pessoas vinculadas ao titular.

Regras
dependente pertence a uma assinatura
dependente utiliza benefícios do titular
plano pode limitar quantidade de dependentes
Decisão importante

Dependente:
sem login próprio.

7. USO / RESGATE (Benefit Usage)

Esse é outro núcleo crítico.

Conceito

Registro de utilização de benefício.

Fluxo básico
Paciente apresenta QR Code
↓
Recepção valida
↓
Sistema registra uso
↓
Limite atualizado

Campos importantes
benefício
paciente
data
quantidade
responsável validação
status

Regras principais
uso deve respeitar limites
uso deve respeitar validade
uso gera histórico
uso pode ser cancelado futuramente

8. QR CODE
Conceito

Identificação rápida da assinatura.

Regras
QR identifica assinatura/paciente
QR não deve expor dados sensíveis
QR pode expirar futuramente

MVP:

QR simples já resolve.

9. PAGAMENTOS
Métodos iniciais
PIX
boleto
manual

Regras
pagamento pertence a assinatura
pagamento possui status
inadimplência afeta assinatura
financeiro pode registrar pagamento manual

Status possíveis
pending
paid
overdue
cancelled

10. HISTÓRICO
Conceito

Toda operação relevante gera histórico.

Exemplos
uso benefício
renovação
cancelamento
pagamento

Isso será importante para:
auditoria
confiança
suporte

11. NOTIFICAÇÕES (FUTURO)

NÃO colocar agora. Mas documentar possível existência.

Exemplos futuros
vencimento
renovação
benefício disponível


O mapa mental macro
Tenant
 ├── Users
 ├── Plans
 │     └── Benefits
 ├── Patients
 │     └── Subscriptions
 │             └── Dependents
 │             └── Payments
 │             └── BenefitUsage