<<<<<<< HEAD
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";

import { getSubscriptionFormOptions } from "../services/get-subscription-form-options";
import { getSubscriptions } from "../services/get-subscriptions";

import { CreateSubscriptionDialog } from "./create-subscription-dialog";
import { SubscriptionsTable } from "./subscriptions-table";

export async function SubscriptionsPage() {
  const [subscriptions, formOptions] =
    await Promise.all([
      getSubscriptions(),
      getSubscriptionFormOptions(),
    ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Subscriptions"
        description="Connect patients to membership plans and establish the lifecycle records that future billing and benefit modules depend on."
        action={
          <CreateSubscriptionDialog
            patients={formOptions.patients}
            membershipPlans={
              formOptions.membershipPlans
            }
          />
        }
      />
=======
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
            Manage subscriptions.
          </p>
        </div>

        <CreateSubscriptionDialog
          patients={patients}
          plans={plans}
        />
      </div>
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)

      <SubscriptionsTable
        subscriptions={subscriptions}
      />
<<<<<<< HEAD
    </DashboardPage>
  );
}
=======
    </div>
  );
}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
