import { PaymentStatus } from "@prisma/client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { MetricGrid } from "@/components/dashboard/metric-grid";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

import { PatientPaymentsTable } from "./patient-payments-table";
import { getBillingOverview } from "../services/billing-foundation";

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

  const receivable =
    overview.patientInvoices
      .filter(
        (invoice) =>
          invoice.status ===
            PaymentStatus.PENDING ||
          invoice.status ===
            PaymentStatus.OVERDUE
      )
      .reduce(
        (total, invoice) =>
          total + invoice.amount,
        0
      );

  const overdueAmount =
    overview.patientInvoices
      .filter(
        (invoice) =>
          invoice.status ===
          PaymentStatus.OVERDUE
      )
      .reduce(
        (total, invoice) =>
          total + invoice.amount,
        0
      );

  const billableTotal =
    overview.patientInvoices
      .filter(
        (invoice) =>
          invoice.status !==
          PaymentStatus.CANCELED
      )
      .reduce(
        (total, invoice) =>
          total + invoice.amount,
        0
      );

  const delinquencyRate =
    billableTotal > 0
      ? (overdueAmount /
          billableTotal) *
        100
      : 0;

  return (
    <DashboardPage>
      <PageHeader
        title={t("billing.title")}
        description={t(
          "billing.sections.patientInvoices.description"
        )}
      />

      <MetricGrid columns="four">
        <MetricCard
          label={t(
            "billing.sections.receivable.title"
          )}
          hint={t(
            "billing.sections.receivable.description"
          )}
          value={formatCurrency(
            receivable
          )}
        />
        <MetricCard
          label={t(
            "billing.sections.received.title"
          )}
          hint={t(
            "billing.sections.received.description"
          )}
          value={formatCurrency(
            overview.monthlyPatientRevenue
          )}
        />
        <MetricCard
          label={t(
            "billing.sections.overdueAmount.title"
          )}
          hint={t(
            "billing.sections.overdueAmount.description"
          )}
          value={formatCurrency(
            overdueAmount
          )}
        />
        <MetricCard
          label={t(
            "billing.sections.delinquencyRate.title"
          )}
          hint={t(
            "billing.sections.delinquencyRate.description"
          )}
          value={`${delinquencyRate.toFixed(1)}%`}
        />
      </MetricGrid>

      <SectionCard
        title={t(
          "billing.sections.patientInvoices.title"
        )}
        description={t(
          "billing.sections.patientInvoices.description"
        )}
      >
        <PatientPaymentsTable
          invoices={
            overview.patientInvoices
          }
          canManageBilling={
            canManageBilling
          }
        />
      </SectionCard>
    </DashboardPage>
  );
}
