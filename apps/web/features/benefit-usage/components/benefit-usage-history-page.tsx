import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { getBenefitUsageHistory } from "../services/get-benefit-usage-history";
import { getPatientBenefitBalance } from "../services/get-patient-benefit-balance";

import { BenefitUsageTable } from "./benefit-usage-table";
import { ConsumeBenefitDialog } from "./consume-benefit-dialog";

export async function BenefitUsageHistoryPage() {
  const t = getTranslations();
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
          title={t(
            "benefitUsage.accessDeniedTitle"
          )}
          description={t(
            "benefitUsage.accessDeniedDescription"
          )}
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
  const canCancelBenefitUsage =
    role === "OWNER" ||
    role === "ADMIN";

  return (
    <DashboardPage>
      <PageHeader
        title={t("benefitUsage.title")}
        description={t(
          "benefitUsage.description"
        )}
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
        canCancelBenefitUsage={
          canCancelBenefitUsage
        }
      />
    </DashboardPage>
  );
}
