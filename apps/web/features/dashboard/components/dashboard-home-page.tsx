<<<<<<< HEAD
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

=======
import { getDashboardMetrics } from "../services/get-dashboard-metrics";

import { MetricCard } from "./metric-card";

>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
export async function DashboardHomePage() {
  const metrics =
    await getDashboardMetrics();

  return (
<<<<<<< HEAD
    <DashboardPage>
      <PageHeader
        title="Dashboard"
        description={`A high-level view of ${metrics.clinicName}'s membership operation across patients, plans, and subscriptions.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Patients"
          value={metrics.totalPatients.toString()}
          hint="Patients registered for this clinic"
          icon={<Users className="size-5" />}
        />

        <MetricCard
          label="Membership Plans"
          value={metrics.totalMembershipPlans.toString()}
          hint="Plans currently configured"
          icon={
            <FileStack className="size-5" />
          }
        />

        <MetricCard
          label="Subscriptions"
          value={metrics.totalSubscriptions.toString()}
          hint="Patient-plan relationships created"
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
=======
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-muted-foreground">
          Overview of your membership platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Patients"
          value={metrics.totalPatients}
          description="Registered patients"
        />

        <MetricCard
          title="Plans"
          value={metrics.totalPlans}
          description="Membership plans"
        />

        <MetricCard
          title="Subscriptions"
          value={
            metrics.totalSubscriptions
          }
          description="Active subscriptions"
        />

        <MetricCard
          title="Revenue"
          value={`$ ${metrics.monthlyRevenue}`}
          description="Monthly recurring revenue"
        />
      </div>

      <div className="border rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-2">
          Recent Activity
        </h2>

        <p className="text-muted-foreground">
          Activity feed coming soon.
        </p>
      </div>
    </div>
  );
}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
