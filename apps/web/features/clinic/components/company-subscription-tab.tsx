import {
  CalendarClock,
  CreditCard,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";

import { ClinicSubscriptionStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getClinicSubscriptionStatusTone } from "@/features/clinic/utils/clinic-status";

import {
  openCompanyPortalAction,
  pauseCompanySubscriptionAction,
  requestCompanySubscriptionCancellationAction,
  resumeCompanySubscriptionAction,
  startCompanyCheckoutAction,
  undoCompanySubscriptionCancellationAction,
} from "@/features/billing/actions/company-subscription-actions";
import { getCompanySubscriptionOverview } from "@/features/billing/services/billing-foundation";

const STATUS_LABEL: Record<
  ClinicSubscriptionStatus,
  string
> = {
  PENDING: "Aguardando ativação",
  TRIAL: "Em teste",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento pendente",
  PAUSED: "Pausada",
  SUSPENDED: "Suspensa",
  CANCELED: "Cancelada",
};

const STATUS_EXPLANATION: Record<
  ClinicSubscriptionStatus,
  string
> = {
  PENDING:
    "Sua assinatura ainda não foi ativada. Fale com o suporte se isso não era esperado.",
  TRIAL:
    "Você está no período de teste gratuito. Nenhuma cobrança acontece até o fim do teste — adicione um cartão a qualquer momento para continuar sem interrupção depois.",
  ACTIVE:
    "Sua assinatura está em dia. A próxima cobrança acontece automaticamente na data abaixo.",
  PAST_DUE:
    "A última cobrança falhou. Atualize a forma de pagamento para evitar a suspensão do acesso.",
  PAUSED:
    "Sua assinatura está pausada — não há cobranças e o acesso operacional fica indisponível até você retomar.",
  SUSPENDED:
    "O acesso está suspenso pela plataforma. Fale com o suporte para regularizar.",
  CANCELED:
    "Sua assinatura foi cancelada. Você pode contratar novamente a qualquer momento.",
};

type Props = {
  checkoutReturn?: "success" | "canceled";
};

export async function CompanySubscriptionTab({
  checkoutReturn,
}: Props) {
  const subscription =
    await getCompanySubscriptionOverview({
      verifyWithGateway: Boolean(
        checkoutReturn
      ),
    });

  if (!subscription) {
    return (
      <SectionCard
        title="Assinatura"
        description="Plano e cobrança da plataforma Sheep para esta empresa."
      >
        <EmptyState
          title="Sem assinatura"
          description="Nenhuma assinatura encontrada para esta empresa ainda."
        />
      </SectionCard>
    );
  }

  const latestInvoice =
    subscription.invoices[0] ?? null;
  const isGatewayLinked =
    subscription.providerKind !== "MANUAL" &&
    Boolean(
      subscription.externalSubscriptionId
    );
  const canStartCheckout =
    isGatewayLinked &&
    (subscription.status ===
      ClinicSubscriptionStatus.TRIAL ||
      subscription.status ===
        ClinicSubscriptionStatus.PAST_DUE);
  const canManagePaymentMethod =
    isGatewayLinked &&
    subscription.status !==
      ClinicSubscriptionStatus.CANCELED;
  const canPause =
    isGatewayLinked &&
    (subscription.status ===
      ClinicSubscriptionStatus.ACTIVE ||
      subscription.status ===
        ClinicSubscriptionStatus.TRIAL);
  const canResume =
    isGatewayLinked &&
    subscription.status ===
      ClinicSubscriptionStatus.PAUSED;
  const canCancel =
    isGatewayLinked &&
    subscription.status !==
      ClinicSubscriptionStatus.CANCELED &&
    !subscription.cancelAtPeriodEnd;

  return (
    <div className="flex flex-col gap-5">
      {checkoutReturn === "success" &&
      (subscription.status ===
        ClinicSubscriptionStatus.ACTIVE ||
        subscription.status ===
          ClinicSubscriptionStatus.TRIAL) ? (
        <div className="rounded-xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success-soft)] p-4 text-sm text-[color:var(--color-success)]">
          Pagamento confirmado — sua
          assinatura está{" "}
          {STATUS_LABEL[
            subscription.status
          ].toLowerCase()}
          .
        </div>
      ) : null}
      {checkoutReturn === "success" &&
      subscription.status !==
        ClinicSubscriptionStatus.ACTIVE &&
      subscription.status !==
        ClinicSubscriptionStatus.TRIAL ? (
        <div className="rounded-xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning-soft)] p-4 text-sm text-[color:var(--color-warning)]">
          O checkout foi concluído, mas o
          provedor ainda não confirmou o
          pagamento. Isso pode levar
          alguns instantes — atualize a
          página em breve.
        </div>
      ) : null}
      {checkoutReturn === "canceled" ? (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          Checkout cancelado — nenhuma
          cobrança foi feita e nada
          mudou na sua assinatura.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Plano atual"
          value={
            subscription.clinicBillingPlan
              .name
          }
          hint={`${formatCurrency(subscription.clinicBillingPlan.monthlyPrice ?? 0)}/mês`}
          icon={
            <CreditCard className="size-5" />
          }
        />
        <MetricCard
          label="Status"
          value={
            STATUS_LABEL[
              subscription.status
            ]
          }
          hint={
            subscription.status ===
            ClinicSubscriptionStatus.TRIAL
              ? `Teste até ${formatDate(subscription.trialEndsAt)}`
              : `Desde ${formatDate(subscription.startedAt)}`
          }
          icon={
            <PlayCircle className="size-5" />
          }
        />
        <MetricCard
          label="Próxima cobrança"
          value={formatDate(
            latestInvoice?.dueDate ??
              subscription.expiresAt
          )}
          hint={
            subscription.cancelAtPeriodEnd
              ? "Assinatura será cancelada nesta data"
              : "Cobrança automática recorrente"
          }
          icon={
            <CalendarClock className="size-5" />
          }
        />
      </div>

      <SectionCard
        title="Assinatura Sheep"
        description={
          STATUS_EXPLANATION[
            subscription.status
          ]
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <StatusIndicator
            tone={getClinicSubscriptionStatusTone(
              subscription.status
            )}
            label={
              STATUS_LABEL[
                subscription.status
              ]
            }
          />

          <div className="flex flex-wrap items-center gap-2">
            {canStartCheckout ? (
              <form
                action={
                  startCompanyCheckoutAction
                }
              >
                <Button
                  type="submit"
                  size="sm"
                >
                  <ExternalLink className="size-4" />
                  {subscription.status ===
                  ClinicSubscriptionStatus.TRIAL
                    ? "Continuar após o teste"
                    : "Atualizar cartão e regularizar"}
                </Button>
              </form>
            ) : null}

            {canManagePaymentMethod ? (
              <form
                action={
                  openCompanyPortalAction
                }
              >
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                >
                  <CreditCard className="size-4" />
                  Gerenciar forma de
                  pagamento
                </Button>
              </form>
            ) : null}

            {canPause ? (
              <form
                id="pause-company-subscription-form"
                action={
                  pauseCompanySubscriptionAction
                }
              >
                <ConfirmSubmitButton
                  formId="pause-company-subscription-form"
                  size="sm"
                  variant="outline"
                  icon={
                    <PauseCircle className="size-4" />
                  }
                  label="Pausar"
                  title="Pausar assinatura?"
                  description="Nenhuma cobrança acontece enquanto estiver pausada, mas o acesso operacional também fica indisponível até você retomar."
                  actionLabel="Pausar"
                />
              </form>
            ) : null}

            {canResume ? (
              <form
                id="resume-company-subscription-form"
                action={
                  resumeCompanySubscriptionAction
                }
              >
                <ConfirmSubmitButton
                  formId="resume-company-subscription-form"
                  size="sm"
                  variant="outline"
                  icon={
                    <PlayCircle className="size-4" />
                  }
                  label="Retomar"
                  title="Retomar assinatura?"
                  description="Isso libera o acesso operacional novamente e volta a cobrar normalmente."
                  actionLabel="Retomar"
                />
              </form>
            ) : null}

            {canCancel ? (
              <form
                id="cancel-company-subscription-form"
                action={
                  requestCompanySubscriptionCancellationAction
                }
              >
                <ConfirmSubmitButton
                  formId="cancel-company-subscription-form"
                  size="sm"
                  variant="destructive"
                  icon={
                    <XCircle className="size-4" />
                  }
                  label="Cancelar"
                  title="Cancelar assinatura?"
                  description={
                    subscription.status ===
                    ClinicSubscriptionStatus.PAUSED
                      ? "A assinatura já está pausada, então o cancelamento é imediato."
                      : `O acesso continua normalmente até ${formatDate(subscription.expiresAt)} — a assinatura não é cancelada de imediato.`
                  }
                  actionLabel="Cancelar"
                />
              </form>
            ) : null}
          </div>
        </div>

        {subscription.cancelAtPeriodEnd ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
            <p className="text-muted-foreground">
              Cancelamento agendado para{" "}
              {formatDate(
                subscription.expiresAt
              )}
              . O acesso continua normal
              até lá.
            </p>
            <form
              action={
                undoCompanySubscriptionCancellationAction
              }
            >
              <Button
                type="submit"
                size="sm"
                variant="outline"
              >
                Manter assinatura
              </Button>
            </form>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
