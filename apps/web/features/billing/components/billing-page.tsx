import {
  ClinicSubscriptionStatus,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { formatCurrency } from "@/lib/formatters";

import { ClinicInvoiceActions } from "./clinic-invoice-actions";
import { ClinicSubscriptionActions } from "./clinic-subscription-actions";
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

function formatOptionalDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

function getPaymentMethodLabel(
  value: PaymentMethod | null | undefined
) {
  switch (value) {
    case PaymentMethod.CARD:
      return "Card";
    case PaymentMethod.PIX:
      return "Pix";
    case PaymentMethod.CASH:
      return "Cash";
    case PaymentMethod.BANK_TRANSFER:
      return "Bank transfer";
    case PaymentMethod.OTHER:
      return "Other";
    default:
      return "Not set";
  }
}

export async function BillingPage() {
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
          title="Billing access denied"
          description="The current role cannot view billing operations."
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
        title="Payments"
        description="Track patient payments, manual invoice handling, and the clinic's Nortex SaaS billing status."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard
          title="Overdue patient invoices"
          description="Open invoices that need manual follow-up."
        >
          <div className="p-4 text-3xl font-semibold">
            {
              overview.overduePatientInvoiceCount
            }
          </div>
        </SectionCard>

        <SectionCard
          title="Monthly patient revenue"
          description="Paid invoice revenue recognized this month."
        >
          <div className="p-4 text-3xl font-semibold">
            {formatCurrency(
              overview.monthlyPatientRevenue
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Platform subscription"
          description="Current Nortex commercial status for this clinic."
        >
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${getSubscriptionStatusClass(
                    overview
                      .clinicSubscription
                      ?.status ??
                      ClinicSubscriptionStatus.TRIAL
                  )}`}
                >
                  {
                    overview
                      .clinicSubscription
                      ?.status
                  }
                </span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Plan:{" "}
                  {
                    overview
                      .clinicSubscription
                      ?.clinicBillingPlan
                      .name
                  }
                </p>
                <p>
                  Trial ends:{" "}
                  {formatOptionalDate(
                    overview
                      .clinicSubscription
                      ?.trialEndsAt
                  )}
                </p>
                <p>
                  Expires:{" "}
                  {formatOptionalDate(
                    overview
                      .clinicSubscription
                      ?.expiresAt
                  )}
                </p>
                <p>
                  Canceled at:{" "}
                  {formatOptionalDate(
                    overview
                      .clinicSubscription
                      ?.canceledAt
                  )}
                </p>
              </div>
              {canManageBilling &&
              overview
                .clinicSubscription ? (
                <ClinicSubscriptionActions
                  subscriptionId={
                    overview
                      .clinicSubscription
                      .id
                  }
                  status={
                    overview
                      .clinicSubscription
                      .status
                  }
                />
              ) : null}
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Patient invoices"
        description="Manual V1 patient billing records created from subscriptions. Canceling a subscription keeps historical invoices visible for follow-up."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Patient
                </th>
                <th className="py-2">
                  Plan
                </th>
                <th className="py-2">
                  Amount
                </th>
                <th className="py-2">
                  Subscription
                </th>
                <th className="py-2">
                  Due
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Payment date
                </th>
                <th className="py-2">
                  Method
                </th>
                <th className="py-2">
                  Payment history
                </th>
                <th className="py-2 text-right">
                  Actions
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
                    No patient invoices found.
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
                          "Detached"}
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
                              {
                                invoice
                                  .subscription
                                  .status
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Manual / detached
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
                          {
                            invoice.status
                          }
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.payments
                          .length > 0 ? (
                          <div className="text-xs">
                            <div>
                              {new Date(
                                invoice
                                  .payments[0]
                                  .paidAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not paid
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
                            No payment history
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
                            Read only
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

      <SectionCard
        title="Clinic SaaS invoices"
        description="Commercial invoices between Nortex and the clinic."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Description
                </th>
                <th className="py-2">
                  Amount
                </th>
                <th className="py-2">
                  Subscription
                </th>
                <th className="py-2">
                  Due
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Payment
                </th>
                <th className="py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.clinicInvoices
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No clinic invoices found.
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
                          "Clinic SaaS invoice"}
                      </td>
                      <td className="py-3">
                        {formatCurrency(
                          invoice.amount
                        )}
                      </td>
                      <td className="py-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {
                              invoice
                                .clinicSubscription
                                .id
                            }
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getSubscriptionStatusClass(
                              invoice
                                .clinicSubscription
                                .status
                            )}`}
                          >
                            {
                              invoice
                                .clinicSubscription
                                .status
                            }
                          </span>
                        </div>
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
                          {
                            invoice.status
                          }
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.payments
                          .length > 0 ? (
                          <div className="text-xs">
                            <div className="font-medium">
                              Last paid:
                            </div>
                            <div>
                              {new Date(
                                invoice
                                  .payments[0]
                                  .paidAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No payment record
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {canManageBilling ? (
                          <ClinicInvoiceActions
                            invoiceId={
                              invoice.id
                            }
                            status={
                              invoice.status
                            }
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Read only
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

      {overview.platformMetrics ? (
        <SectionCard
          title="Platform admin metrics"
          description="Only visible when the current user is operating without clinic tenancy."
        >
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Active clinics
              </p>
              <p className="text-2xl font-semibold">
                {
                  overview
                    .platformMetrics
                    .activeClinics
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Trial clinics
              </p>
              <p className="text-2xl font-semibold">
                {
                  overview
                    .platformMetrics
                    .trialClinics
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Past due clinics
              </p>
              <p className="text-2xl font-semibold">
                {
                  overview
                    .platformMetrics
                    .pastDueClinics
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Monthly SaaS revenue
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrency(
                  overview
                    .platformMetrics
                    .monthlySaasRevenue
                )}
              </p>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </DashboardPage>
  );
}
