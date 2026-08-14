import type { LegendItem, LegendSection } from "@/components/dashboard/screen-legend";

/**
 * Reusable legend content shared across screens (statuses, roles). Kept in
 * one place so wording/tone stays consistent everywhere a given status or
 * role appears, instead of every screen writing its own description.
 */

export const CLIENT_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Ativo",
    tone: "success",
    description:
      "Cliente pode ter assinatura, usar benefícios e receber cobranças normalmente.",
  },
  {
    label: "Inativo",
    tone: "neutral",
    description:
      "Cadastro desativado — assinaturas ativas foram canceladas. Reative para voltar a operar.",
  },
];

export const CLIENT_FINANCIAL_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Em dia",
    tone: "success",
    description: "Nenhuma fatura pendente ou em atraso para este cliente.",
  },
  {
    label: "N pendente(s)",
    tone: "warning",
    description: "Há fatura(s) aguardando vencimento, ainda não em atraso.",
  },
  {
    label: "N em atraso",
    tone: "danger",
    description: "Há fatura(s) com vencimento já passado sem pagamento.",
  },
];

export const SUBSCRIPTION_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Ativa",
    tone: "success",
    description: "Assinatura vigente, cliente com acesso pleno aos benefícios do plano.",
  },
  {
    label: "Pausada",
    tone: "warning",
    description: "Suspensa temporariamente por decisão da empresa; não gera cobrança nem uso de benefício.",
  },
  {
    label: "Pendente",
    tone: "neutral",
    description: "Assinatura criada, mas ainda não iniciada.",
  },
  {
    label: "Em atraso",
    tone: "warning",
    description: "Pagamento não confirmado; a empresa deve regularizar ou renovar.",
  },
  {
    label: "Cancelada",
    tone: "danger",
    description: "Encerrada — o cliente não tem mais acesso aos benefícios deste plano.",
  },
  {
    label: "Expirada",
    tone: "neutral",
    description: "Vigência terminou sem renovação.",
  },
];

export const PATIENT_INVOICE_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Pendente",
    tone: "neutral",
    description: "Aguardando pagamento, dentro do prazo de vencimento.",
  },
  {
    label: "Pago",
    tone: "success",
    description: "Pagamento confirmado para esta cobrança.",
  },
  {
    label: "Em atraso",
    tone: "warning",
    description: "Venceu sem pagamento confirmado.",
  },
  {
    label: "Cancelado",
    tone: "danger",
    description: "Cobrança cancelada — não será cobrada nem conta como pendência.",
  },
  {
    label: "Falhou",
    tone: "danger",
    description: "Tentativa de cobrança não foi concluída.",
  },
];

export const CLINIC_SUBSCRIPTION_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Teste",
    tone: "info",
    description: "Período de avaliação gratuito da plataforma Sheep, com todos os recursos liberados.",
  },
  {
    label: "Ativa",
    tone: "success",
    description: "Assinatura Sheep em dia — a empresa opera normalmente.",
  },
  {
    label: "Em atraso",
    tone: "warning",
    description: "Última cobrança falhou; a empresa ainda opera durante o período de tolerância.",
  },
  {
    label: "Pausada",
    tone: "warning",
    description: "Pausada pela própria empresa — retome quando quiser voltar a operar.",
  },
  {
    label: "Suspensa",
    tone: "danger",
    description: "Acesso operacional bloqueado após atraso prolongado; regularize a Assinatura Sheep para retomar.",
  },
  {
    label: "Cancelada",
    tone: "danger",
    description: "Assinatura Sheep encerrada.",
  },
];

export const PLAN_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Ativo",
    tone: "success",
    description: "Disponível para novas assinaturas e para uso de benefícios.",
  },
  {
    label: "Inativo",
    tone: "neutral",
    description: "Desativado — seus benefícios também ficam indisponíveis e assinaturas ativas são canceladas.",
  },
];

export const BENEFIT_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Ativo",
    tone: "success",
    description: "Pode ser usado pelos clientes com assinatura no plano.",
  },
  {
    label: "Inativo",
    tone: "neutral",
    description: "Indisponível para uso até ser reativado.",
  },
];

export const BENEFIT_USAGE_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Ativo",
    tone: "success",
    description: "Uso registrado e válido, contando para o limite do período.",
  },
  {
    label: "Cancelado",
    tone: "danger",
    description: "Uso anulado por OWNER ou ADMIN; não conta mais para o limite. O registro permanece no histórico.",
  },
];

export const MODULE_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Habilitado",
    tone: "success",
    description: "Módulo disponível para a empresa usar.",
  },
  {
    label: "Desabilitado",
    tone: "neutral",
    description: "Indisponível — a empresa não tem acesso às funções desse módulo.",
  },
];

export const SUPPORT_THREAD_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Aberto",
    tone: "info",
    description: "Chamado criado, ainda sem primeira resposta.",
  },
  {
    label: "Em atendimento",
    tone: "info",
    description: "Alguém já está tratando o chamado.",
  },
  {
    label: "Aguardando clínica",
    tone: "warning",
    description: "A Sheep respondeu e espera um retorno da empresa.",
  },
  {
    label: "Aguardando plataforma",
    tone: "warning",
    description: "A empresa respondeu e espera um retorno da Sheep.",
  },
  {
    label: "Resolvido",
    tone: "success",
    description: "Chamado concluído; pode ser reaberto se necessário.",
  },
  {
    label: "Fechado",
    tone: "neutral",
    description: "Encerrado definitivamente.",
  },
];

export const USER_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Ativo",
    tone: "success",
    description: "Pode entrar e usar o sistema conforme seu perfil.",
  },
  {
    label: "Pendente",
    tone: "warning",
    description: "Convite enviado, aguardando a pessoa definir a senha e concluir o acesso.",
  },
  {
    label: "Inativo",
    tone: "neutral",
    description: "Acesso bloqueado — não consegue entrar até ser reativado.",
  },
];

export const CLINIC_STATUS_LEGEND: LegendItem[] = [
  {
    label: "Ativa",
    tone: "success",
    description: "Empresa cliente com acesso normal à plataforma.",
  },
  {
    label: "Inativa",
    tone: "neutral",
    description: "Conta desativada pela Sheep — sem acesso à plataforma.",
  },
];

export const USER_ROLE_LEGEND: LegendItem[] = [
  {
    label: "Proprietário",
    description: "Acesso total da empresa, incluindo equipe, assinatura Sheep e configurações sensíveis. Não pode ser removido se for o único.",
  },
  {
    label: "Administrador",
    description: "Gerencia a operação e a equipe do dia a dia, com quase todo o acesso do Proprietário.",
  },
  {
    label: "Equipe",
    description: "Foco na rotina: clientes, assinaturas e atendimentos. Sem acesso a planos, cobrança ou configurações da empresa.",
  },
  {
    label: "Financeiro",
    description: "Foco em cobrança: consulta clientes e planos, mas só gerencia faturas e pagamentos.",
  },
  {
    label: "Somente leitura",
    description: "Pode consultar clientes, planos e atendimentos, mas não altera nada.",
  },
];

export const PLATFORM_USER_ROLE_LEGEND: LegendItem[] = [
  {
    label: "Proprietário",
    description: "Controle total da plataforma Sheep, incluindo equipe interna e faturamento de todas as empresas.",
  },
  {
    label: "Administrador",
    description: "Gerencia empresas clientes, chamados e planos comerciais, com quase todo o acesso do Proprietário.",
  },
];

export function legendSection(
  title: string,
  items: LegendItem[]
): LegendSection {
  return { title, items };
}
