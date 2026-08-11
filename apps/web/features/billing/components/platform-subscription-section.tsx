import { ClinicSubscriptionStatus } from "@prisma/client";

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
import {
  getClinicSubscriptionStatusTone,
  getPaymentStatusTone,
} from "@/features/clinic/utils/clinic-status";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

type PlatformSubscriptionOverview = Awaited<
  ReturnType<
    typeof import("../services/billing-foundation").getBillingOverview
  >
>;

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
            <StatusIndicator
              tone={getClinicSubscriptionStatusTone(
                subscription?.status ??
                  ClinicSubscriptionStatus.PENDING
              )}
              label={
                subscription?.status
                  ? t(
                      `billing.status.${subscription.status}`
                    )
                  : t("shared.states.notSet")
              }
            />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("shared.labels.description")}
              </TableHead>
              <TableHead>
                {t("shared.labels.amount")}
              </TableHead>
              <TableHead>
                {t("shared.labels.due")}
              </TableHead>
              <TableHead>
                {t("shared.labels.status")}
              </TableHead>
              <TableHead>
                {t("shared.labels.paymentDate")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.clinicInvoices
              .length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-muted-foreground"
                >
                  {t("billing.sections.clinicInvoices.empty")}
                </TableCell>
              </TableRow>
            ) : (
              overview.clinicInvoices.map(
                (invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {invoice.description ??
                        t("billing.sections.clinicInvoices.defaultDescription")}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        invoice.amount
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        invoice.dueDate
                      ).toLocaleDateString(
                        "pt-BR"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        tone={getPaymentStatusTone(
                          invoice.status
                        )}
                        label={t(
                          `billing.status.${invoice.status}`
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.payments[0]
                        ? new Date(
                            invoice.payments[0]
                              .paidAt
                          ).toLocaleDateString(
                            "pt-BR"
                          )
                        : t("billing.notPaid")}
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </>
  );
}
