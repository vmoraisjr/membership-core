import { DashboardPage } from "@/components/layout/dashboard-page";
import { ClinicAssignmentRequired } from "@/components/dashboard/clinic-assignment-required";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { getMembershipBenefits } from "../services/get-membership-benefits";
import { getMembershipBenefitFormOptions } from "../services/get-membership-benefit-form-options";

import { MembershipBenefitsTable } from "./membership-benefits-table";
import { MembershipBenefitDialog } from "./membership-benefit-dialog";

type Props = {
  contextPlanId?: string;
};

export async function MembershipBenefitsPage({
  contextPlanId,
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
      "benefits",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t(
            "benefits.accessDeniedTitle"
          )}
          description={t(
            "benefits.accessDeniedDescription"
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

  const [benefits, plans] =
    await Promise.all([
      getMembershipBenefits(),
      getMembershipBenefitFormOptions(),
    ]);

  const canManageBenefits =
    hasPermission(
      role,
      "benefits",
      "manage"
    );
  const canDeleteBenefitsPermanently =
    hasPermission(
      role,
      "benefits",
      "deletePermanent"
    );

  return (
    <DashboardPage>
      <PageHeader
        title={t("benefits.title")}
        description={
          contextPlanId
            ? t(
                "benefits.filteredDescription"
              )
            : t("benefits.description")
        }
        action={
          canManageBenefits ? (
            <MembershipBenefitDialog
              plans={plans}
              defaultMembershipPlanId={
                contextPlanId
              }
            />
          ) : undefined
        }
      />

      <MembershipBenefitsTable
        benefits={benefits}
        plans={plans}
        selectedPlanId={contextPlanId}
        canManageBenefits={
          canManageBenefits
        }
        canDeleteBenefitsPermanently={
          canDeleteBenefitsPermanently
        }
      />
    </DashboardPage>
  );
}
