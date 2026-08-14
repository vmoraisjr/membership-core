import {
  CalendarClock,
  CheckCheck,
  CreditCard,
  ShieldCheck,
  ShieldQuestion,
  WalletCards,
} from "lucide-react";

import { ClinicSubscriptionStatus } from "@prisma/client";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  getClinicSubscriptionStatusTone,
  getPaymentStatusTone,
} from "@/features/clinic/utils/clinic-status";
import { BILLING_POLICY } from "@/features/billing/constants/billing-policy";
import { getTranslations } from "@/i18n/messages";

import {
  platformMarkClinicInvoiceOverdueAction,
  platformMarkClinicInvoicePaidAction,
  platformUpdateClinicSubscriptionStatusAction,
} from "../actions/platform-manage-clinic-subscription";
import { SUBSCRIPTION_STATUS_ACTIONS } from "../constants/subscription-status-actions";
import {
  canTransitionClinicSubscriptionStatus,
  getClinicBillingDetail,
} from "../services/billing-foundation";

import { ActivateTrialSubmitButton } from "./activate-trial-submit-button";
import { CompanyBillingSupportActions } from "./company-billing-support-actions";
import { PlatformPlanChangeDialog } from "./platform-plan-change-dialog";

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function maskExternalId(id: string) {
  if (id.length <= 10) {
    return id;
  }

  return `${id.slice(0, 10)}••••${id.slice(-4)}`;
}

const PROVIDER_KIND_LABEL: Record<
  string,
  string
> = {
  MANUAL: "Manual (conciliação por planilha/admin)",
  FAKE: "Cartão via provedor (simulado)",
};

type Props = {
  clinicId: string;
  clinicName: string;
};

export async function CompanyBillingTab({
  clinicId,
  clinicName,
}: Props) {
  const t = getTranslations();
  const { subscriptions, allPlans } =
    await getClinicBillingDetail(clinicId);
  const subscription =
    subscriptions[0] ?? null;

  if (!subscription) {
    return (
      <SectionCard
        title="Plano e cobrança"
        description="Nenhuma assinatura SaaS encontrada para esta empresa ainda."
      >
        <EmptyState
          title="Sem assinatura"
          description="O provisionamento da assinatura SaaS acontece automaticamente na primeira ativação da empresa."
        />
      </SectionCard>
    );
  }

  const invoices = subscription.invoices;
  const latestInvoice = invoices[0] ?? null;
  const clinicLabel = clinicName;
  const isGatewayLinked =
    subscription.providerKind !==
    "MANUAL";

  // Manual status/invoice actions could contradict the provider's own
  // record of truth, so they're only offered for legacy MANUAL
  // subscriptions (PAY-004) — gateway-linked ones get the safe actions
  // (sync, check divergence, payment link, support note) instead.
  const statusActions = isGatewayLinked
    ? []
    : SUBSCRIPTION_STATUS_ACTIONS.filter(
        (action) =>
          canTransitionClinicSubscriptionStatus(
            subscription.status,
            action.status
          )
      );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Plano atual"
          value={
            subscription.clinicBillingPlan
              .name
          }
          hint={`Status: ${t(`billing.status.${subscription.status}`)}`}
          icon={
            <CreditCard className="size-5" />
          }
        />
        <MetricCard
          label="Próximo vencimento"
          value={formatDate(
            latestInvoice?.dueDate ?? null
          )}
          hint="Baseado na cobrança SaaS mais recente."
          icon={
            <CalendarClock className="size-5" />
          }
        />
        <MetricCard
          label="Última cobrança"
          value={
            latestInvoice
              ? formatCurrency(
                  latestInvoice.amount
                )
              : "—"
          }
          hint={
            latestInvoice
              ? t(
                  `billing.status.${latestInvoice.status}`
                )
              : "Nenhuma cobrança registrada."
          }
          icon={
            <WalletCards className="size-5" />
          }
        />
        <MetricCard
          label="Origem da cobrança"
          value={
            PROVIDER_KIND_LABEL[
              subscription.providerKind
            ] ??
            subscription.providerKind
          }
          hint={
            isGatewayLinked
              ? subscription.syncStatus ===
                "DIVERGED"
                ? "Divergência detectada — revise e sincronize."
                : `Sincronizado ${formatDate(subscription.lastSyncedAt)}`
              : "Sem provedor vinculado."
          }
          icon={
            subscription.syncStatus ===
            "DIVERGED" ? (
              <ShieldQuestion className="size-5" />
            ) : (
              <ShieldCheck className="size-5" />
            )
          }
        />
      </div>

      {isGatewayLinked &&
      (subscription.status ===
        "PAST_DUE" ||
        subscription.cancelAtPeriodEnd) ? (
        <div className="rounded-xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning-soft)] p-4 text-sm text-[color:var(--color-warning)]">
          {subscription.status ===
          "PAST_DUE"
            ? `Pagamento pendente — tentativa ${subscription.paymentRetryCount} de ${BILLING_POLICY.maxPaymentRetryAttempts}. Próxima tentativa: ${formatDate(subscription.nextPaymentAttemptAt)}.`
            : `Cancelamento agendado para ${formatDate(subscription.expiresAt)} — acesso continua normal até lá.`}
        </div>
      ) : null}

      <SectionCard
        title="Assinatura SaaS"
        description="Plano, período de testes e ciclo de vida da assinatura desta empresa."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusIndicator
              tone={getClinicSubscriptionStatusTone(
                subscription.status
              )}
              label={t(
                `billing.status.${subscription.status}`
              )}
            />
            <span className="text-sm text-muted-foreground">
              Início:{" "}
              {formatDate(
                subscription.startedAt
              )}
              {" · "}
              Trial até:{" "}
              {formatDate(
                subscription.trialEndsAt
              )}
              {" · "}
              Expira:{" "}
              {formatDate(
                subscription.expiresAt
              )}
            </span>
            {subscription.externalSubscriptionId ? (
              <span className="text-xs text-muted-foreground">
                ID externo:{" "}
                {maskExternalId(
                  subscription.externalSubscriptionId
                )}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PlatformPlanChangeDialog
              subscriptionId={
                subscription.id
              }
              currentPlanId={
                subscription.clinicBillingPlanId
              }
              currentPlanName={
                subscription
                  .clinicBillingPlan.name
              }
              plans={allPlans}
            />

            {statusActions.map((action) => {
              const formId = `company-subscription-status-${subscription.id}-${action.status}`;

              return (
                <form
                  key={action.status}
                  id={formId}
                  action={
                    platformUpdateClinicSubscriptionStatusAction
                  }
                  className="inline-flex"
                >
                  <input
                    type="hidden"
                    name="clinicId"
                    value={clinicId}
                  />
                  <input
                    type="hidden"
                    name="subscriptionId"
                    value={subscription.id}
                  />
                  <input
                    type="hidden"
                    name="status"
                    value={action.status}
                  />
                  {action.status ===
                  ClinicSubscriptionStatus.TRIAL ? (
                    <>
                      <input
                        type="hidden"
                        name="trialEndsAt"
                      />
                      <ActivateTrialSubmitButton
                        formId={formId}
                        title={`${t(action.labelKey)} — ${clinicLabel}?`}
                        description={
                          action.confirmDescription
                        }
                        actionLabel={t(
                          action.labelKey
                        )}
                        defaultTrialEndsAt={formatDateInputValue(
                          (() => {
                            const date =
                              new Date();
                            date.setDate(
                              date.getDate() +
                                subscription
                                  .clinicBillingPlan
                                  .trialDays
                            );
                            return date;
                          })()
                        )}
                      />
                    </>
                  ) : (
                    <ConfirmSubmitButton
                      formId={formId}
                      title={`${t(action.labelKey)} — ${clinicLabel}?`}
                      description={
                        action.confirmDescription
                      }
                      actionLabel={t(
                        action.labelKey
                      )}
                      label={t(
                        action.labelKey
                      )}
                      icon={
                        <action.icon className="size-4" />
                      }
                      variant={
                        action.variant
                      }
                      size="sm"
                      tooltip={t(
                        action.labelKey
                      )}
                    />
                  )}
                </form>
              );
            })}

            {isGatewayLinked ? (
              <CompanyBillingSupportActions
                subscriptionId={
                  subscription.id
                }
              />
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Faturas"
        description={
          isGatewayLinked
            ? "Histórico de cobranças SaaS desta empresa — reconciliadas automaticamente pelos webhooks do provedor."
            : "Histórico de cobranças SaaS desta empresa, com ações de conciliação manual."
        }
      >
        {invoices.length === 0 ? (
          <EmptyState
            title="Nenhuma fatura registrada"
            description="Faturas aparecem aqui assim que geradas pelo ciclo de cobrança."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Descrição
                </TableHead>
                <TableHead>
                  Vencimento
                </TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  Último pagamento
                </TableHead>
                <TableHead className="text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="align-top">
                    {invoice.description ??
                      "Fatura SaaS"}
                  </TableCell>
                  <TableCell className="align-top">
                    {formatDate(
                      invoice.dueDate
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {formatCurrency(
                      invoice.amount
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusIndicator
                      tone={getPaymentStatusTone(
                        invoice.status
                      )}
                      label={t(
                        `billing.status.${invoice.status}`
                      )}
                    />
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {invoice.payments[0]
                      ? formatDate(
                          invoice.payments[0]
                            .paidAt
                        )
                      : "Sem pagamento registrado"}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {!isGatewayLinked &&
                      (invoice.status ===
                        "PENDING" ||
                        invoice.status ===
                          "OVERDUE") ? (
                        <form
                          id={`company-invoice-paid-${invoice.id}`}
                          action={
                            platformMarkClinicInvoicePaidAction
                          }
                        >
                          <input
                            type="hidden"
                            name="invoiceId"
                            value={
                              invoice.id
                            }
                          />
                          <ConfirmSubmitButton
                            formId={`company-invoice-paid-${invoice.id}`}
                            title={`${t("billing.actions.markPaid")}?`}
                            description="Isso marca a fatura como paga. Confirme para aplicar."
                            actionLabel={t(
                              "billing.actions.markPaid"
                            )}
                            label=""
                            icon={
                              <CheckCheck className="size-4" />
                            }
                            variant="outline"
                            size="icon-sm"
                            tooltip={t(
                              "billing.actions.markPaid"
                            )}
                          />
                        </form>
                      ) : null}
                      {!isGatewayLinked &&
                      invoice.status ===
                        "PENDING" ? (
                        <form
                          id={`company-invoice-overdue-${invoice.id}`}
                          action={
                            platformMarkClinicInvoiceOverdueAction
                          }
                        >
                          <input
                            type="hidden"
                            name="invoiceId"
                            value={
                              invoice.id
                            }
                          />
                          <ConfirmSubmitButton
                            formId={`company-invoice-overdue-${invoice.id}`}
                            title={`${t("billing.actions.markOverdue")}?`}
                            description="Isso marca a fatura como atrasada. Confirme para aplicar."
                            actionLabel={t(
                              "billing.actions.markOverdue"
                            )}
                            label=""
                            icon={
                              <CalendarClock className="size-4" />
                            }
                            variant="outline"
                            size="icon-sm"
                            tooltip={t(
                              "billing.actions.markOverdue"
                            )}
                          />
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
