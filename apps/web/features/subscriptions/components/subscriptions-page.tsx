import { prisma } from "@/lib/prisma";

import { getSubscriptions } from "../services/get-subscriptions";

import { DashboardPage } from "@/components/dashboard/dashboard-page";

import { PageHeader } from "@/components/dashboard/page-header";

import { SubscriptionsTable } from "./subscriptions-table";

import { SubscriptionDialog } from "./subscription-dialog";

export async function SubscriptionsPage() {
  const subscriptions =
    await getSubscriptions();

  const patients =
    await prisma.patient.findMany();

  const plans =
    await prisma.membershipPlan.findMany();

  return (
    <DashboardPage>
      <PageHeader
        title="Subscriptions"
        description="Manage patient memberships and lifecycle states."
        action={
          <SubscriptionDialog
            patients={patients}
            plans={plans}
          />
        }
      />

      <SubscriptionsTable
        subscriptions={
          subscriptions
        }
        patients={patients}
        plans={plans}
      />
    </DashboardPage>
  );
}