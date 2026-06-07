import {
  BadgeDollarSign,
  CreditCard,
  HeartPulse,
  ReceiptText,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { formatCurrency } from "@/lib/formatters";

import { getDashboardMetrics } from "../services/get-dashboard-metrics";

export async function DashboardHomePage() {
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      "dashboard",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Dashboard access denied"
          description="The current role cannot view dashboard metrics."
        />
      </DashboardPage>
    );
  }

  const metrics =
    await getDashboardMetrics();

  return (
    <DashboardPage>
      <PageHeader
        title="Dashboard"
        description={
          metrics.scope === "clinic"
            ? `A high-level view of ${metrics.clinicName}'s membership operation across patients, plans, and subscriptions.`
            : "A high-level platform snapshot covering clinic health, SaaS billing, and active commercial modules in V1."
        }
      />

      {metrics.scope === "clinic" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Active Patients"
              value={metrics.activePatients.toString()}
              hint="Patients currently available for membership operations"
              icon={<Users className="size-5" />}
            />

            <MetricCard
              label="Active Subscriptions"
              value={metrics.activeSubscriptionsCount.toString()}
              hint="Subscriptions currently in force"
              icon={
                <CreditCard className="size-5" />
              }
            />

            <MetricCard
              label="Overdue Invoices"
              value={metrics.overduePatientInvoices.toString()}
              hint="Patient invoices that need manual follow-up"
              icon={
                <ReceiptText className="size-5" />
              }
            />

            <MetricCard
              label="Monthly Patient Revenue"
              value={formatCurrency(
                metrics.monthlyPatientRevenue
              )}
              hint="Paid patient invoice revenue recognized this month"
              icon={
                <BadgeDollarSign className="size-5" />
              }
            />

            <MetricCard
              label="Benefits Consumed"
              value={metrics.benefitsConsumed.toString()}
              hint="Benefit quantities consumed during the current month"
              icon={
                <HeartPulse className="size-5" />
              }
            />

            <MetricCard
              label="Active Plans"
              value={metrics.activePlansCount.toString()}
              hint="Membership plans currently available for new subscriptions"
              icon={<CreditCard className="size-5" />}
            />
          </div>

          <SectionCard
            title="Operational Snapshot"
            description="Real tenant-scoped counts from the current clinic help leadership spot enrollment, billing pressure and benefit usage at a glance."
          >
            <div className="grid gap-4 p-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  Patient revenue baseline
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Paid patient invoices produced {formatCurrency(metrics.monthlyPatientRevenue)} this month for the current clinic.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  Billing attention needed
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {metrics.overduePatientInvoices} patient invoices are overdue and require manual follow-up in the V1 billing flow.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  Benefit usage activity
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {metrics.benefitUsageEvents} total benefit usage events have been recorded for this clinic so far.
                </p>
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}

      {metrics.platformMetrics ? (
        <SectionCard
          title="Platform Snapshot"
          description="Admin-only platform billing metrics derived from real clinic subscription data."
        >
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-medium">
                Active clinics
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {
                  metrics
                    .platformMetrics
                    .activeClinics
                }
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-medium">
                Trial clinics
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {
                  metrics
                    .platformMetrics
                    .trialClinics
                }
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-medium">
                Past due clinics
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {
                  metrics
                    .platformMetrics
                    .pastDueClinics
                }
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-medium">
                Monthly SaaS revenue
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(
                  metrics
                    .platformMetrics
                    .monthlySaasRevenue
                )}
              </p>
            </div>
          </div>

          <div className="border-t p-4">
            <p className="text-sm font-medium">
              Active module counts
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {metrics.platformMetrics.activeModuleCounts.map(
                (moduleMetric) => (
                  <div
                    key={moduleMetric.key}
                    className="rounded-xl border border-border/60 bg-muted/40 p-4"
                  >
                    <p className="text-sm font-medium">
                      {moduleMetric.name}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {
                        moduleMetric.enabledClinicCount
                      }
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {moduleMetric.isV1Active
                        ? "Active V1 module assignments across clinics."
                        : "Future module kept dormant in V1."}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </SectionCard>
      ) : null}
    </DashboardPage>
  );
}
