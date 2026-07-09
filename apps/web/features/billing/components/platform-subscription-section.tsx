import {
  ClinicSubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";

import { SectionCard } from "@/components/dashboard/section-card";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

type PlatformSubscriptionOverview = Awaited<
  ReturnType<
    typeof import("../services/billing-foundation").getBillingOverview
  >
>;

function getSubscriptionStatusClass(
  status: ClinicSubscriptionStatus
) {
  switch (status) {
    case ClinicSubscriptionStatus.ACTIVE:
      return "bg-emerald-100 text-emerald-700";
    case ClinicSubscriptionStatus.TRIAL:
    case ClinicSubscriptionStatus.PENDING:
      return "bg-sky-100 text-sky-700";
    case ClinicSubscriptionStatus.PAST_DUE:
    case ClinicSubscriptionStatus.SUSPENDED:
      return "bg-amber-100 text-amber-800";
    case ClinicSubscriptionStatus.CANCELED:
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPaymentStatusClass(
  status: PaymentStatus
) {
  switch (status) {
    case PaymentStatus.PAID:
      return "bg-emerald-100 text-emerald-700";
    case PaymentStatus.OVERDUE:
      return "bg-amber-100 text-amber-800";
    case PaymentStatus.CANCELED:
    case PaymentStatus.FAILED:
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatOptionalDate(
  value: Date | string | null | undefined
) {
  const t = getTranslations();

  if (!value) {
    return t("shared.states.notSet");
  }

  return new Date(value).toLocaleDateString();
}

export function PlatformSubscriptionSection({
  overview,
}: {
  overview: PlatformSubscriptionOverview;
}) {
  const t = getTranslations();
  const subscription =
    overview.clinicSubscription;

  return (
    <>
      <SectionCard
        title="Assinatura da plataforma"
        description="Acompanhe o módulo contratado, valor, status, vigência e o próximo ciclo comercial da clínica."
      >
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Plano contratado
            </p>
            <p className="font-medium">
              {subscription
                ?.clinicBillingPlan.name ??
                t("shared.states.notSet")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Valor da assinatura
            </p>
            <p className="font-medium">
              {formatCurrency(
                subscription
                  ?.clinicBillingPlan
                  .monthlyPrice ??
                  subscription
                    ?.clinicBillingPlan
                    .annualPrice ??
                  0
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Status
            </p>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getSubscriptionStatusClass(
                subscription?.status ??
                  ClinicSubscriptionStatus.PENDING
              )}`}
            >
              {subscription?.status
                ? t(
                    `billing.status.${subscription.status}`
                  )
                : t("shared.states.notSet")}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Data de expiração
            </p>
            <p className="font-medium">
              {formatOptionalDate(
                subscription?.expiresAt
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Próximo pagamento
            </p>
            <p className="font-medium">
              {formatOptionalDate(
                overview.clinicInvoices[0]
                  ?.dueDate
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Módulo contratado
            </p>
            <p className="font-medium">
              Membership Core
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Histórico de pagamento da plataforma"
        description="Cobranças comerciais entre a plataforma e a clínica."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("shared.labels.description")}
                </th>
                <th className="py-2">
                  {t("shared.labels.amount")}
                </th>
                <th className="py-2">
                  {t("shared.labels.due")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  {t("shared.labels.paymentDate")}
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.clinicInvoices
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t("billing.sections.clinicInvoices.empty")}
                  </td>
                </tr>
              ) : (
                overview.clinicInvoices.map(
                  (invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {invoice.description ??
                          t("billing.sections.clinicInvoices.defaultDescription")}
                      </td>
                      <td className="py-3">
                        {formatCurrency(
                          invoice.amount
                        )}
                      </td>
                      <td className="py-3">
                        {new Date(
                          invoice.dueDate
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPaymentStatusClass(
                            invoice.status
                          )}`}
                        >
                          {t(
                            `billing.status.${invoice.status}`
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.payments[0]
                          ? new Date(
                              invoice.payments[0]
                                .paidAt
                            ).toLocaleDateString()
                          : t("billing.notPaid")}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}
