import {
  Ban,
  CircleCheckBig,
  FlaskConical,
  PauseCircle,
} from "lucide-react";

import { ClinicSubscriptionStatus } from "@prisma/client";

export type SubscriptionStatusAction = {
  status: ClinicSubscriptionStatus;
  labelKey: string;
  icon: typeof CircleCheckBig;
  variant: "outline" | "destructive";
  confirmDescription: string;
};

/** Shared between the global "Assinaturas SaaS" list and the empresa workspace's "Plano e cobrança" tab — keep the transition set and copy in one place. */
export const SUBSCRIPTION_STATUS_ACTIONS: SubscriptionStatusAction[] =
  [
    {
      status: ClinicSubscriptionStatus.ACTIVE,
      labelKey: "billing.actions.markActive",
      icon: CircleCheckBig,
      variant: "outline",
      confirmDescription:
        "Marca a assinatura como ativa e cobrando normalmente.",
    },
    {
      status: ClinicSubscriptionStatus.TRIAL,
      labelKey: "billing.actions.sendToTrial",
      icon: FlaskConical,
      variant: "outline",
      confirmDescription:
        "Coloca a conta em período de teste até a data informada. A próxima parcela já é gerada com vencimento nessa data e fica disponível na lista de pagamentos da empresa.",
    },
    {
      status: ClinicSubscriptionStatus.SUSPENDED,
      labelKey: "billing.actions.suspend",
      icon: PauseCircle,
      variant: "outline",
      confirmDescription:
        "Suspende o acesso da clínica sem cancelar a assinatura — pode ser reativada depois.",
    },
    {
      status: ClinicSubscriptionStatus.CANCELED,
      labelKey: "billing.actions.cancelSubscription",
      icon: Ban,
      variant: "destructive",
      confirmDescription:
        "Cancela a assinatura da clínica. Essa ação não tem confirmação automática de reversão — reative manualmente se for engano.",
    },
  ];
