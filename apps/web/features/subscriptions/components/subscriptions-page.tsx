import { getSubscriptions } from "../services/get-subscriptions";
import { getSubscriptionFormOptions } from "../services/get-subscription-form-options";

import { DashboardPage } from "@/components/dashboard/dashboard-page";

import { PageHeader } from "@/components/dashboard/page-header";

import { SubscriptionsTable } from "./subscriptions-table";

import { SubscriptionDialog } from "./subscription-dialog";

type Props = {
  contextPlanId?: string;
  contextPatientId?: string;
};

export async function SubscriptionsPage({
  contextPlanId,
  contextPatientId,
}: Props) {
  const [
    subscriptions,
    subscriptionFormOptions,
  ] = await Promise.all([
    getSubscriptions(),
    getSubscriptionFormOptions(),
  ]);

  const patients =
    subscriptionFormOptions.patients;

  const plans =
    subscriptionFormOptions.membershipPlans;

  return (
    <DashboardPage>
      <PageHeader
        title="Subscriptions"
        description={
          contextPlanId ||
          contextPatientId
            ? "Support screen filtered by the selected plan or patient context."
            : "Support screen for patient memberships and lifecycle states."
        }
        action={
          <SubscriptionDialog
            patients={patients}
            plans={plans}
            defaultPatientId={
              contextPatientId
            }
            defaultMembershipPlanId={
              contextPlanId
            }
          />
        }
      />

      <SubscriptionsTable
        subscriptions={
          subscriptions
        }
        patients={patients}
        plans={plans}
        selectedPlanId={contextPlanId}
        selectedPatientId={
          contextPatientId
        }
      />
    </DashboardPage>
  );
}
