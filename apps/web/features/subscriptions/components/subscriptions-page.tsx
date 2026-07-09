import { getSubscriptions } from "../services/get-subscriptions";
import { getSubscriptionFormOptions } from "../services/get-subscription-form-options";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { ClinicAssignmentRequired } from "@/components/dashboard/clinic-assignment-required";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

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
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      getCurrentAppUser(),
    ]);

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
          title={t(
            "subscriptions.accessDeniedTitle"
          )}
          description={t(
            "subscriptions.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  if (!currentUser?.clinicId) {
    return (
      <DashboardPage>
        <ClinicAssignmentRequired />
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
        title={t("subscriptions.title")}
        description={
          contextPlanId ||
          contextPatientId
            ? t(
                "subscriptions.filteredDescription"
              )
            : t("subscriptions.description")
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
