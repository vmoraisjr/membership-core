import { getMembershipPlans } from "../services/get-membership-plans";
import { getMembershipBenefitFormOptions } from "@/features/membership-benefits/services/get-membership-benefit-form-options";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { MembershipPlansTable } from "./membership-plans-table";
import { MembershipPlanDialog } from "./membership-plan-dialog";

export async function MembershipPlansPage() {
  const t = getTranslations();
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(role, "plans", "view")
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t("plans.accessDeniedTitle")}
          description={t(
            "plans.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  const [plans, benefitPlans] =
    await Promise.all([
      getMembershipPlans(),
      getMembershipBenefitFormOptions(),
    ]);

  const canManagePlans =
    hasPermission(
      role,
      "plans",
      "manage"
    );
  const canDeletePlansPermanently =
    hasPermission(
      role,
      "plans",
      "deletePermanent"
    );
  const canManageBenefits =
    hasPermission(
      role,
      "benefits",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title={t("plans.title")}
        description={t("plans.description")}
        action={
          canManagePlans ? (
            <MembershipPlanDialog />
          ) : undefined
        }
      />
      <MembershipPlansTable
        plans={plans}
        benefitPlans={benefitPlans}
        canManagePlans={
          canManagePlans
        }
        canDeletePlansPermanently={
          canDeletePlansPermanently
        }
        canManageBenefits={
          canManageBenefits
        }
      />
    </DashboardPage>
  );
}
