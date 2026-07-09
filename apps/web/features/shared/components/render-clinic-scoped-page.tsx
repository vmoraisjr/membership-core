import type { ReactNode } from "react";

import { ClinicAssignmentRequired } from "@/components/dashboard/clinic-assignment-required";
import { ClinicPlanActivationRequired } from "@/components/dashboard/clinic-plan-activation-required";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getBillingOverview, canClinicOperate } from "@/features/billing/services/billing-foundation";

export async function renderClinicScopedPage(
  content: ReactNode
) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser?.clinicId) {
    return (
      <DashboardPage>
        <ClinicAssignmentRequired />
      </DashboardPage>
    );
  }

  return content;
}

export async function renderOperationalClinicScopedPage(
  content: ReactNode
) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser?.clinicId) {
    return (
      <DashboardPage>
        <ClinicAssignmentRequired />
      </DashboardPage>
    );
  }

  const overview =
    await getBillingOverview();

  if (
    !canClinicOperate(
      overview.clinicSubscription?.status
    )
  ) {
    return (
      <DashboardPage>
        <ClinicPlanActivationRequired />
      </DashboardPage>
    );
  }

  return content;
}
