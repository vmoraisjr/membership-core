import {
  AlertTriangle,
  CheckCheck,
  Filter,
  Search,
} from "lucide-react";
import { PaymentStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";
import { getPaymentStatusTone } from "@/features/clinic/utils/clinic-status";

import {
  platformMarkClinicInvoiceOverdueAction,
  platformMarkClinicInvoicePaidAction,
} from "../actions/platform-manage-clinic-subscription";
import { getPlatformClinicBillingOverview } from "../services/billing-foundation";
import { PaymentAttentionBar } from "./payment-attention-bar";

type Props = {
  filters: {
    clinicId?: string;
    planId?: string;
    status?: string;
    query?: string;
  };
};

export async function PlatformSaasPaymentsPage({
  filters,
}: Props) {
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      getCurrentAppUser(),
    ]);

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

  if (
    currentUser?.clinicId ||
    (currentUser?.role !== "OWNER" &&
      currentUser?.role !== "ADMIN")
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Área exclusiva da plataforma"
          description="Os pagamentos SaaS das contas clientes são acompanhados apenas pela plataforma."
        />
      </DashboardPage>
    );
  }

  const overview =
    await getPlatformClinicBillingOverview();
  const normalizedQuery =
    filters.query?.trim().toLowerCase() ??
    "";
  const invoiceRows =
    overview.clinicSubscriptions.flatMap(
      (subscription) =>
        subscription.invoices.map(
          (invoice) => ({
            invoice,
            subscription,
          })
        )
    );
  const filteredInvoices = invoiceRows.filter(
    ({ invoice, subscription }) => {
      if (
        filters.clinicId &&
        subscription.clinicId !==
          filters.clinicId
      ) {
        return false;
      }

      if (
        filters.planId &&
        subscription.clinicBillingPlanId !==
          filters.planId
      ) {
        return false;
      }

      if (
        filters.status &&
        invoice.status !== filters.status
      ) {
        return false;
      }

      if (
        normalizedQuery &&
        ![
          subscription.clinic.brandName ??
            "",
          subscription.clinic.name,
          subscription.clinic.email,
          subscription.clinicBillingPlan.name,
          invoice.description ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ) {
        return false;
      }

      return true;
    }
  );
  const clinicOptions = Array.from(
    new Map(
      overview.clinicSubscriptions.map(
        (subscription) => [
          subscription.clinicId,
          {
            id: subscription.clinicId,
            name:
              subscription.clinic
                .brandName ??
              subscription.clinic.name,
          },
        ]
      )
    ).values()
  );
  const overdueInvoices =
    invoiceRows.filter(
      ({ invoice }) =>
        invoice.status ===
        PaymentStatus.OVERDUE
    );
  const pendingInvoices =
    invoiceRows.filter(
      ({ invoice }) =>
        invoice.status ===
        PaymentStatus.PENDING
    );
  const paidInvoices =
    invoiceRows.filter(
      ({ invoice }) =>
        invoice.status ===
        PaymentStatus.PAID
    );

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Financeiro SaaS"
        title={t(
          "billing.paymentsPage.title"
        )}
        description={t(
          "billing.paymentsPage.description"
        )}
      />

      <PaymentAttentionBar
        overdueCount={overdueInvoices.length}
        paidCount={paidInvoices.length}
        pendingCount={pendingInvoices.length}
        totalCount={invoiceRows.length}
      />

      <DataTableContainer
        title="Faturas e recebimentos"
        description="Filtre a fila por empresa, plano ou status da cobrança para atualizar rapidamente o caixa da plataforma."
        toolbar={
          <form
            method="get"
            className="grid gap-4 lg:grid-cols-[220px_220px_220px_minmax(0,1fr)_auto]"
          >
            <label className="field-stack">
              <span className="field-label">
                {t(
                  "billing.subscriptionsPage.filters.company"
                )}
              </span>
              <Select
                name="clinicId"
                defaultValue={
                  filters.clinicId ?? ""
                }
              >
                <option value="">
                  {t(
                    "billing.subscriptionsPage.filters.allCompanies"
                  )}
                </option>
                {clinicOptions.map((clinic) => (
                  <option
                    key={clinic.id}
                    value={clinic.id}
                  >
                    {clinic.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                {t(
                  "billing.subscriptionsPage.filters.plan"
                )}
              </span>
              <Select
                name="planId"
                defaultValue={
                  filters.planId ?? ""
                }
              >
                <option value="">
                  {t("shared.filters.allPlans")}
                </option>
                {overview.allPlans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                {t("shared.filters.statusFilter")}
              </span>
              <Select
                name="status"
                defaultValue={
                  filters.status ?? ""
                }
              >
                <option value="">
                  {t("shared.filters.all")}
                </option>
                {Object.values(PaymentStatus).map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {t(
                        `billing.status.${status}`
                      )}
                    </option>
                  )
                )}
              </Select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                {t(
                  "billing.paymentsPage.filters.searchLabel"
                )}
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="query"
                  defaultValue={
                    filters.query ?? ""
                  }
                  placeholder={t(
                    "billing.paymentsPage.filters.searchPlaceholder"
                  )}
                  className="pl-9"
                />
              </div>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit">
                <Filter className="size-4" />
                {t("shared.actions.applyFilters")}
              </Button>
              <Button
                type="button"
                asChild
                variant="outline"
              >
                <a href="/dashboard/billing/payments">
                  {t("shared.actions.clear")}
                </a>
              </Button>
            </div>
          </form>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t(
                  "billing.subscriptionsPage.table.company"
                )}
              </TableHead>
              <TableHead>
                {t("shared.labels.plan")}
              </TableHead>
              <TableHead>
                {t("shared.labels.description")}
              </TableHead>
              <TableHead>
                {t("shared.labels.dueDate")}
              </TableHead>
              <TableHead>
                {t("shared.labels.amount")}
              </TableHead>
              <TableHead>
                {t("shared.labels.status")}
              </TableHead>
              <TableHead>
                {t(
                  "billing.paymentsPage.table.lastPayment"
                )}
              </TableHead>
              <TableHead className="text-right">
                {t("shared.labels.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length ===
            0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="p-0"
                >
                  <EmptyState
                    title={t(
                      "billing.paymentsPage.empty.title"
                    )}
                    description={t(
                      "billing.paymentsPage.empty.description"
                    )}
                    action={
                      <Button
                        type="button"
                        asChild
                        variant="outline"
                      >
                        <a href="/dashboard/billing/payments">
                          {t(
                            "shared.actions.clear"
                          )}
                        </a>
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map(
                ({ invoice, subscription }) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {subscription
                            .clinic
                            .brandName ??
                            subscription
                              .clinic.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {
                            subscription
                              .clinic.email
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {
                        subscription
                          .clinicBillingPlan
                          .name
                      }
                    </TableCell>
                    <TableCell className="align-top">
                      {invoice.description ??
                        t(
                          "billing.paymentsPage.table.defaultDescription"
                        )}
                    </TableCell>
                    <TableCell className="align-top">
                      {new Date(
                        invoice.dueDate
                      ).toLocaleDateString(
                        "pt-BR"
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
                    <TableCell className="align-top">
                      {invoice.payments[0] ? (
                        <div className="space-y-1 text-xs">
                          <div>
                            {new Date(
                              invoice
                                .payments[0]
                                .paidAt
                            ).toLocaleDateString(
                              "pt-BR"
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {t(
                              "billing.paymentsPage.table.recorded"
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t(
                            "clinics.details.noPaymentRecorded"
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <div className="flex justify-end gap-2">
                        {(invoice.status ===
                          PaymentStatus.PENDING ||
                          invoice.status ===
                            PaymentStatus.OVERDUE) && (
                          <form
                            action={platformMarkClinicInvoicePaidAction}
                          >
                            <input
                              type="hidden"
                              name="invoiceId"
                              value={invoice.id}
                            />
                            <Button
                              type="submit"
                              size="icon-sm"
                              variant="outline"
                              title={t(
                                "billing.actions.markPaid"
                              )}
                              aria-label={t(
                                "billing.actions.markPaid"
                              )}
                            >
                              <CheckCheck className="size-4" />
                            </Button>
                          </form>
                        )}

                        {invoice.status ===
                        PaymentStatus.PENDING ? (
                          <form
                            action={platformMarkClinicInvoiceOverdueAction}
                          >
                            <input
                              type="hidden"
                              name="invoiceId"
                              value={invoice.id}
                            />
                            <Button
                              type="submit"
                              size="icon-sm"
                              variant="outline"
                              title={t(
                                "billing.actions.markOverdue"
                              )}
                              aria-label={t(
                                "billing.actions.markOverdue"
                              )}
                            >
                              <AlertTriangle className="size-4" />
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </DataTableContainer>
    </DashboardPage>
  );
}
