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

      <SubscriptionsTable
        subscriptions={subscriptions}
      />
    </DashboardPage>
  );
}
