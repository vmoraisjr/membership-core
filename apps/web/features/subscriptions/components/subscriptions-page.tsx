import { prisma } from "@/lib/prisma";

import { getSubscriptions } from "../services/get-subscriptions";

import { SubscriptionsTable } from "./subscriptions-table";

import { CreateSubscriptionDialog } from "./create-subscription-dialog";

export async function SubscriptionsPage() {
  const subscriptions =
    await getSubscriptions();

  const patients =
    await prisma.patient.findMany();

  const plans =
    await prisma.membershipPlan.findMany();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Subscriptions
          </h1>

          <p className="text-muted-foreground">
            Manage active subscriptions.
          </p>
        </div>

        <CreateSubscriptionDialog
          patients={patients}
          plans={plans}
        />
      </div>

      <SubscriptionsTable
        subscriptions={subscriptions}
      />
    </div>
  );
}