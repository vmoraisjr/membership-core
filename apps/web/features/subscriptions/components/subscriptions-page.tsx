import { getSubscriptions } from "../services/get-subscriptions";
import { getSubscriptionFormOptions } from "../services/get-subscription-form-options";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";

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
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      "subscriptions",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Subscriptions access denied"
          description="The current role cannot view subscriptions."
        />
      </DashboardPage>
    );
  }

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
  const canManageSubscriptions =
    hasPermission(
      role,
      "subscriptions",
      "manage"
    );

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
          canManageSubscriptions ? (
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
          ) : undefined
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
        canManageSubscriptions={
          canManageSubscriptions
        }
      />
    </DashboardPage>
  );
}
