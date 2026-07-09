import {
  ClinicSubscriptionStatus,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

import { PatientInvoiceActions } from "./patient-invoice-actions";
import { getBillingOverview } from "../services/billing-foundation";

function getStatusClass(status: PaymentStatus) {
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

function getSubscriptionStatusClass(
  status:
    | SubscriptionStatus
    | ClinicSubscriptionStatus
) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "TRIAL":
    case "PENDING":
      return "bg-sky-100 text-sky-700";
    case "OVERDUE":
    case "PAST_DUE":
    case "SUSPENDED":
      return "bg-amber-100 text-amber-800";
    case "CANCELED":
    case "EXPIRED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPaymentStatusLabel(
  status: PaymentStatus
) {
  const t = getTranslations();
  return t(`billing.status.${status}`);
}

function getSubscriptionStatusLabel(
  status:
    | SubscriptionStatus
    | ClinicSubscriptionStatus
) {
  const t = getTranslations();
  return t(`billing.status.${status}`);
}

function getPaymentMethodLabel(
  value: PaymentMethod | null | undefined
) {
  const t = getTranslations();

  switch (value) {
    case PaymentMethod.CARD:
      return t("billing.paymentMethod.CARD");
    case PaymentMethod.PIX:
      return t("billing.paymentMethod.PIX");
    case PaymentMethod.CASH:
      return t("billing.paymentMethod.CASH");
    case PaymentMethod.BANK_TRANSFER:
      return t("billing.paymentMethod.BANK_TRANSFER");
    case PaymentMethod.OTHER:
      return t("billing.paymentMethod.OTHER");
    default:
      return t("shared.states.notSet");
  }
}

export async function PatientPaymentsPage() {
  const t = getTranslations();
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      "billing",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t("billing.accessDeniedTitle")}
          description={t("billing.accessDeniedDescription")}
        />
      </DashboardPage>
    );
  }

  const overview =
    await getBillingOverview();
  const canManageBilling =
    hasPermission(
      role,
      "billing",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title={t("billing.title")}
        description="Acompanhe apenas as cobranças e pagamentos das assinaturas dos pacientes nesta área operacional."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          title={t("billing.sections.overduePatientInvoices.title")}
          description={t("billing.sections.overduePatientInvoices.description")}
        >
          <div className="p-4 text-3xl font-semibold">
            {
              overview.overduePatientInvoiceCount
            }
          </div>
        </SectionCard>

        <SectionCard
          title={t("billing.sections.monthlyPatientRevenue.title")}
          description={t("billing.sections.monthlyPatientRevenue.description")}
        >
          <div className="p-4 text-3xl font-semibold">
            {formatCurrency(
              overview.monthlyPatientRevenue
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t("billing.sections.patientInvoices.title")}
        description={t("billing.sections.patientInvoices.description")}
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("patients.title")}
                </th>
                <th className="py-2">
                  {t("shared.labels.plan")}
                </th>
                <th className="py-2">
                  {t("shared.labels.amount")}
                </th>
                <th className="py-2">
                  {t("shared.labels.subscription")}
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
                <th className="py-2">
                  {t("shared.labels.method")}
                </th>
                <th className="py-2">
                  {t("shared.labels.paymentHistory")}
                </th>
                <th className="py-2 text-right">
                  {t("shared.labels.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.patientInvoices
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t("billing.sections.patientInvoices.empty")}
                  </td>
                </tr>
              ) : (
                overview.patientInvoices.map(
                  (invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {
                          invoice.patient
                            .fullName
                        }
                      </td>
                      <td className="py-3">
                        {invoice.subscription
                          ?.membershipPlan
                          ?.name ??
                          t("shared.states.detached")}
                      </td>
                      <td className="py-3">
                        {formatCurrency(
                          invoice.amount
                        )}
                      </td>
                      <td className="py-3">
                        {invoice.subscription ? (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              {
                                invoice
                                  .subscription.id
                              }
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${getSubscriptionStatusClass(
                                invoice
                                  .subscription
                                  .status
                              )}`}
                            >
                              {getSubscriptionStatusLabel(
                                invoice
                                  .subscription
                                  .status
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.manualDetached")}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {new Date(
                          invoice.dueDate
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                            invoice.status
                          )}`}
                        >
                          {getPaymentStatusLabel(
                            invoice.status
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.payments
                          .length > 0 ? (
                          <div className="text-xs">
                            {new Date(
                              invoice
                                .payments[0]
                                .paidAt
                            ).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.notPaid")}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-xs">
                          {getPaymentMethodLabel(
                            invoice.payments[0]
                              ?.paymentMethod ??
                              invoice.paymentMethod
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.payments
                          .length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {invoice.payments.map(
                              (payment) => (
                                <div
                                  key={
                                    payment.id
                                  }
                                >
                                  {[
                                    payment.status,
                                    getPaymentMethodLabel(
                                      payment.paymentMethod
                                    ),
                                    new Date(
                                      payment.paidAt
                                    ).toLocaleDateString(),
                                  ].join(
                                    " · "
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.noPaymentHistory")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {canManageBilling ? (
                          <PatientInvoiceActions
                            invoiceId={
                              invoice.id
                            }
                            status={
                              invoice.status
                            }
                            defaultPaymentMethod={
                              invoice.paymentMethod ??
                              invoice
                                .payments[0]
                                ?.paymentMethod
                            }
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.readOnly")}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
