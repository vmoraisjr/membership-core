import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";

import { getBenefitUsageHistory } from "../services/get-benefit-usage-history";
import { getPatientBenefitBalance } from "../services/get-patient-benefit-balance";

import { BenefitUsageTable } from "./benefit-usage-table";
import { ConsumeBenefitDialog } from "./consume-benefit-dialog";

export async function BenefitUsageHistoryPage() {
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      "benefitUsage",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Benefit usage access denied"
          description="The current role cannot view benefit usage history."
        />
      </DashboardPage>
    );
  }

  const [usages, balances] =
    await Promise.all([
      getBenefitUsageHistory(),
      getPatientBenefitBalance(),
    ]);

  const canManageBenefitUsage =
    hasPermission(
      role,
      "benefitUsage",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title="Benefit Usage"
        description="Consume patient benefits, enforce limits, and review history."
        action={
          canManageBenefitUsage ? (
            <ConsumeBenefitDialog
              balances={balances}
            />
          ) : undefined
        }
      />

      <BenefitUsageTable
        usages={usages}
      />
    </DashboardPage>
  );
}
