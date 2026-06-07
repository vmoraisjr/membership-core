import {
  ClinicSubscriptionStatus,
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

import { activateClinicSubscriptionAction } from "../actions/activate-clinic-subscription";
import { cancelClinicSubscriptionAction } from "../actions/cancel-clinic-subscription";
import { markClinicInvoiceOverdueAction } from "../actions/mark-clinic-invoice-overdue";
import { markClinicInvoicePaidAction } from "../actions/mark-clinic-invoice-paid";
import { markPatientInvoiceOverdueAction } from "../actions/mark-patient-invoice-overdue";
import { markPatientInvoicePaidAction } from "../actions/mark-patient-invoice-paid";
import { suspendClinicSubscriptionAction } from "../actions/suspend-clinic-subscription";
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
        title="Billing"
        description="Track patient invoices, manual payment confirmation, and the clinic's Nortex SaaS subscription status."
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
                <div className="flex flex-wrap gap-2">
                  {overview
                    .clinicSubscription
                    .status !==
                  ClinicSubscriptionStatus.ACTIVE ? (
                    <form
                      action={
                        activateClinicSubscriptionAction
                      }
                    >
                      <input
                        type="hidden"
                        name="subscriptionId"
                        value={
                          overview
                            .clinicSubscription
                            .id
                        }
                      />
                      <button
                        type="submit"
                        className="rounded-md border px-3 py-1.5"
                      >
                        Mark active
                      </button>
                    </form>
                  ) : null}
                  {overview
                    .clinicSubscription
                    .status !==
                    ClinicSubscriptionStatus.SUSPENDED &&
                  overview
                    .clinicSubscription
                    .status !==
                    ClinicSubscriptionStatus.CANCELED ? (
                    <form
                      action={
                        suspendClinicSubscriptionAction
                      }
                    >
                      <input
                        type="hidden"
                        name="subscriptionId"
                        value={
                          overview
                            .clinicSubscription
                            .id
                        }
                      />
                      <button
                        type="submit"
                        className="rounded-md border px-3 py-1.5"
                      >
                        Suspend
                      </button>
                    </form>
                  ) : null}
                  {overview
                    .clinicSubscription
                    .status !==
                  ClinicSubscriptionStatus.CANCELED ? (
                    <form
                      action={
                        cancelClinicSubscriptionAction
                      }
                    >
                      <input
                        type="hidden"
                        name="subscriptionId"
                        value={
                          overview
                            .clinicSubscription
                            .id
                        }
                      />
                      <button
                        type="submit"
                        className="rounded-md border px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Canceled subscriptions stay visible for history and are not auto-recreated.
                    </span>
                  )}
                </div>
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
              {overview.patientInvoices
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                          <div className="flex justify-end gap-2">
                            {invoice.status ===
                              PaymentStatus.PENDING ||
                            invoice.status ===
                              PaymentStatus.OVERDUE ? (
                              <form
                                action={
                                  markPatientInvoicePaidAction
                                }
                              >
                                <input
                                  type="hidden"
                                  name="invoiceId"
                                  value={
                                    invoice.id
                                  }
                                />
                                <button
                                  type="submit"
                                  className="rounded-md border px-3 py-1.5"
                                >
                                  Mark paid
                                </button>
                              </form>
                            ) : null}
                            {invoice.status ===
                            PaymentStatus.PENDING ? (
                              <form
                                action={
                                  markPatientInvoiceOverdueAction
                                }
                              >
                                <input
                                  type="hidden"
                                  name="invoiceId"
                                  value={
                                    invoice.id
                                  }
                                />
                                <button
                                  type="submit"
                                  className="rounded-md border px-3 py-1.5"
                                >
                                  Mark overdue
                                </button>
                              </form>
                            ) : null}
                            {invoice.status !==
                              PaymentStatus.PENDING &&
                            invoice.status !==
                              PaymentStatus.OVERDUE ? (
                              <span className="text-xs text-muted-foreground">
                                Locked status
                              </span>
                            ) : null}
                          </div>
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
                          <div className="flex justify-end gap-2">
                            {invoice.status ===
                              PaymentStatus.PENDING ||
                            invoice.status ===
                              PaymentStatus.OVERDUE ? (
                              <form
                                action={
                                  markClinicInvoicePaidAction
                                }
                              >
                                <input
                                  type="hidden"
                                  name="invoiceId"
                                  value={
                                    invoice.id
                                  }
                                />
                                <button
                                  type="submit"
                                  className="rounded-md border px-3 py-1.5"
                                >
                                  Mark paid
                                </button>
                              </form>
                            ) : null}
                            {invoice.status ===
                            PaymentStatus.PENDING ? (
                              <form
                                action={
                                  markClinicInvoiceOverdueAction
                                }
                              >
                                <input
                                  type="hidden"
                                  name="invoiceId"
                                  value={
                                    invoice.id
                                  }
                                />
                                <button
                                  type="submit"
                                  className="rounded-md border px-3 py-1.5"
                                >
                                  Mark overdue
                                </button>
                              </form>
                            ) : null}
                            {invoice.status !==
                              PaymentStatus.PENDING &&
                            invoice.status !==
                              PaymentStatus.OVERDUE ? (
                              <span className="text-xs text-muted-foreground">
                                Locked status
                              </span>
                            ) : null}
                          </div>
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
