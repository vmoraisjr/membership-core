import { getMembershipPlans } from "../services/get-membership-plans";
import { getMembershipBenefitFormOptions } from "@/features/membership-benefits/services/get-membership-benefit-form-options";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";

import { MembershipPlansTable } from "./membership-plans-table";
import { MembershipPlanDialog } from "./membership-plan-dialog";

export async function MembershipPlansPage() {
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(role, "plans", "view")
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Plans access denied"
          description="The current role cannot view membership plans."
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
  const canManageBenefits =
    hasPermission(
      role,
      "benefits",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title="Membership Plans"
        description="Manage active and inactive plans, their benefits, and new subscriptions from a single screen."
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
        canManageBenefits={
          canManageBenefits
        }
      />
    </DashboardPage>
  );
}
