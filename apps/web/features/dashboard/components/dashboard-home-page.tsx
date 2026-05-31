import {
  BadgeDollarSign,
  CreditCard,
  FileStack,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { formatCurrency } from "@/lib/formatters";

import { getDashboardMetrics } from "../services/get-dashboard-metrics";

export async function DashboardHomePage() {
  const metrics =
    await getDashboardMetrics();

  return (
    <DashboardPage>
      <PageHeader
        title="Dashboard"
        description={`A high-level view of ${metrics.clinicName}'s membership operation across patients, plans, and subscriptions.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          label="Mocked Monthly Revenue"
          value={formatCurrency(
            metrics.mockedMonthlyRevenue
          )}
          hint="Derived from active subscriptions and plan pricing"
          icon={
            <BadgeDollarSign className="size-5" />
          }
        />
      </div>

      <SectionCard
        title="Platform Snapshot"
        description="This dashboard intentionally stays lightweight and tenant-scoped. It gives each clinic a quick operational summary without moving orchestration out of feature modules."
      >
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Patient growth foundation
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Patient records are already isolated by clinic and now feed subscription creation.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Commercial catalog foundation
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Plans and benefits stay attached to the current tenant, keeping future billing and redemption flows aligned.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Subscription foundation
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The new relational layer now connects patients and plans so later modules can evolve from real platform state.
            </p>
          </div>
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
