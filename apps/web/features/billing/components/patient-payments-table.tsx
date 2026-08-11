"use client";

import { useMemo, useState } from "react";

import {
  PaymentMethod,
  PaymentStatus,
  type ClinicSubscriptionStatus,
  type SubscriptionStatus,
} from "@prisma/client";

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { EmptyState } from "@/components/dashboard/empty-state";
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
import { useTranslations } from "@/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { PatientInvoiceActions } from "./patient-invoice-actions";

type Invoice = {
  id: string;
  amount: number;
  status: PaymentStatus;
  dueDate: Date;
  paymentMethod: PaymentMethod | null;
  patient: {
    fullName: string;
  };
  subscription: {
    id: string;
    status:
      | SubscriptionStatus
      | ClinicSubscriptionStatus;
    membershipPlan: {
      name: string;
    } | null;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    paidAt: Date;
    status: string;
    paymentMethod: PaymentMethod | null;
  }>;
};

type Props = {
  invoices: Invoice[];
  canManageBilling: boolean;
};

const PAYMENT_STATUS_TONE: Record<
  PaymentStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  PAID: "success",
  OVERDUE: "warning",
  PENDING: "neutral",
  CANCELED: "danger",
  FAILED: "danger",
  REFUNDED: "neutral",
};

const PERIOD_OPTIONS = [
  { value: "all", labelKey: "shared.filters.allPeriods" },
  { value: "overdue", labelKey: "shared.states.overdue" },
  { value: "30", labelKey: "shared.filters.last30Days" },
  { value: "90", labelKey: "shared.filters.last90Days" },
] as const;

type PeriodFilter =
  (typeof PERIOD_OPTIONS)[number]["value"];

function matchesPeriod(
  invoice: Invoice,
  period: PeriodFilter
) {
  if (period === "all") {
    return true;
  }

  const dueDate = new Date(invoice.dueDate);

  if (period === "overdue") {
    return (
      invoice.status ===
        PaymentStatus.OVERDUE ||
      (invoice.status ===
        PaymentStatus.PENDING &&
        dueDate < new Date())
    );
  }

  const days = period === "30" ? 30 : 90;
  const cutoff = new Date(
    Date.now() +
      days * 24 * 60 * 60 * 1000
  );

  return dueDate <= cutoff;
}

export function PatientPaymentsTable({
  invoices,
  canManageBilling,
}: Props) {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [methodFilter, setMethodFilter] =
    useState("all");
  const [planFilter, setPlanFilter] =
    useState("all");
  const [periodFilter, setPeriodFilter] =
    useState<PeriodFilter>("all");
  const [search, setSearch] =
    useState("");

  const planOptions = useMemo(() => {
    const names = new Set<string>();
    invoices.forEach((invoice) => {
      if (
        invoice.subscription
          ?.membershipPlan?.name
      ) {
        names.add(
          invoice.subscription
            .membershipPlan.name
        );
      }
    });
    return Array.from(names).sort();
  }, [invoices]);

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleInvoices = invoices.filter(
    (invoice) => {
      if (
        statusFilter !== "all" &&
        invoice.status !== statusFilter
      ) {
        return false;
      }

      if (
        methodFilter !== "all" &&
        invoice.paymentMethod !==
          methodFilter
      ) {
        return false;
      }

      if (
        planFilter !== "all" &&
        invoice.subscription
          ?.membershipPlan?.name !==
          planFilter
      ) {
        return false;
      }

      if (
        !matchesPeriod(
          invoice,
          periodFilter
        )
      ) {
        return false;
      }

      if (
        normalizedSearch.length > 0
      ) {
        const haystack = [
          invoice.patient.fullName,
          invoice.subscription
            ?.membershipPlan?.name ??
            "",
        ]
          .join(" ")
          .toLowerCase();

        if (
          !haystack.includes(
            normalizedSearch
          )
        ) {
          return false;
        }
      }

      return true;
    }
  );

  const hasAnyFilterApplied =
    statusFilter !== "all" ||
    methodFilter !== "all" ||
    planFilter !== "all" ||
    periodFilter !== "all" ||
    normalizedSearch.length > 0;

  return (
    <div className="workspace-section">
      <div className="workspace-toolbar grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t("shared.filters.statusFilter")}
          </label>
          <Select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              {t("shared.filters.all")}
            </option>
            {Object.values(
              PaymentStatus
            ).map((status) => (
              <option
                key={status}
                value={status}
              >
                {t(
                  `billing.status.${status}`
                )}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t(
              "billing.table.methodFilter"
            )}
          </label>
          <Select
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              {t("shared.filters.all")}
            </option>
            {Object.values(
              PaymentMethod
            ).map((method) => (
              <option
                key={method}
                value={method}
              >
                {t(
                  `billing.paymentMethod.${method}`
                )}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t("shared.filters.planFilter")}
          </label>
          <Select
            value={planFilter}
            onChange={(event) =>
              setPlanFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              {t(
                "shared.filters.allPlans"
              )}
            </option>
            {planOptions.map((name) => (
              <option
                key={name}
                value={name}
              >
                {name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t(
              "billing.table.dueDateFilter"
            )}
          </label>
          <Select
            value={periodFilter}
            onChange={(event) =>
              setPeriodFilter(
                event.target
                  .value as PeriodFilter
              )
            }
          >
            {PERIOD_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {t(option.labelKey)}
                </option>
              )
            )}
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t(
              "billing.table.searchPatientOrPlan"
            )}
          </label>
          <Input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={t(
              "billing.table.searchPatientOrPlan"
            )}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t("patients.table.patient")}
            </TableHead>
            <TableHead>
              {t("shared.labels.plan")}
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
              {t("shared.labels.method")}
            </TableHead>
            <TableHead>
              {t(
                "shared.labels.paymentHistory"
              )}
            </TableHead>
            <TableHead>
              {t("shared.labels.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleInvoices.map(
            (invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="align-top">
                  <div className="flex items-center gap-2.5">
                    <CompanyAvatarMark
                      name={
                        invoice.patient
                          .fullName
                      }
                    />
                    {
                      invoice.patient
                        .fullName
                    }
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  {invoice.subscription
                    ?.membershipPlan
                    ?.name ??
                    t(
                      "shared.states.detached"
                    )}
                </TableCell>
                <TableCell className="align-top tabular-nums">
                  {formatCurrency(
                    invoice.amount
                  )}
                </TableCell>
                <TableCell className="align-top">
                  {formatDate(
                    invoice.dueDate
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <StatusIndicator
                    tone={
                      PAYMENT_STATUS_TONE[
                        invoice.status
                      ]
                    }
                    label={t(
                      `billing.status.${invoice.status}`
                    )}
                  />
                </TableCell>
                <TableCell className="align-top text-sm">
                  {invoice.paymentMethod
                    ? t(
                        `billing.paymentMethod.${invoice.paymentMethod}`
                      )
                    : t(
                        "shared.states.notSet"
                      )}
                </TableCell>
                <TableCell className="align-top">
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
                            {formatDate(
                              payment.paidAt
                            )}
                            {payment.paymentMethod
                              ? ` · ${t(`billing.paymentMethod.${payment.paymentMethod}`)}`
                              : ""}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t(
                        "billing.noPaymentHistory"
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell className="align-top text-right">
                  {canManageBilling ? (
                    <PatientInvoiceActions
                      invoiceId={
                        invoice.id
                      }
                      status={
                        invoice.status
                      }
                      defaultPaymentMethod={
                        invoice.payments[0]
                          ?.paymentMethod ??
                        invoice.paymentMethod
                      }
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("billing.readOnly")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          )}

          {visibleInvoices.length ===
            0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="p-0"
              >
                <EmptyState
                  title={t(
                    hasAnyFilterApplied
                      ? "billing.table.noResultsTitle"
                      : "billing.sections.patientInvoices.empty"
                  )}
                  description={
                    hasAnyFilterApplied
                      ? t(
                          "billing.table.noResultsDescription"
                        )
                      : ""
                  }
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
