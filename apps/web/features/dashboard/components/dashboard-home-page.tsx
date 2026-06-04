import {
  BadgeDollarSign,
  CalendarClock,
  CreditCard,
  FileStack,
  HeartPulse,
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
        description={`A high-level view of ${metrics.clinicName}'s membership operation across patients, plans, and subscriptions.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Active Patients"
          value={metrics.activePatients.toString()}
          hint="Patients currently available for membership operations"
          icon={<Users className="size-5" />}
        />

        <MetricCard
          label="Active Plans"
          value={metrics.activeMembershipPlans.toString()}
          hint="Plans currently available for enrollment"
          icon={
            <FileStack className="size-5" />
          }
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
          label="Monthly Revenue"
          value={formatCurrency(
            metrics.monthlyRevenue
          )}
          hint="Derived from active subscriptions and current monthly plan pricing"
          icon={
            <BadgeDollarSign className="size-5" />
          }
        />

        <MetricCard
          label="Annual Revenue"
          value={formatCurrency(
            metrics.annualRevenue
          )}
          hint="Annual plan pricing plus monthly plan fallback projections"
          icon={
            <FileStack className="size-5" />
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
          label="Expiring Subscriptions"
          value={metrics.expiringSubscriptionsCount.toString()}
          hint="Active or overdue subscriptions expiring in the next 7 days"
          icon={
            <CalendarClock className="size-5" />
          }
        />
      </div>

      <SectionCard
        title="Operational Snapshot"
        description="Real tenant-scoped counts from the current clinic help leadership spot enrollment, revenue, and usage pressure at a glance."
      >
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Active plan catalog
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {metrics.activeMembershipPlans} active membership plans are currently available for new enrollments.
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

          <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Revenue baseline
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Current active subscriptions represent {formatCurrency(metrics.monthlyRevenue)} in monthly recurring revenue.
            </p>
          </div>
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
