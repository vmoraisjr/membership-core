import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";

import { getBenefitUsageHistory } from "../services/get-benefit-usage-history";
import { getPatientBenefitBalance } from "../services/get-patient-benefit-balance";

import { BenefitUsageTable } from "./benefit-usage-table";
import { ConsumeBenefitDialog } from "./consume-benefit-dialog";

export async function BenefitUsageHistoryPage() {
  const [usages, balances] =
    await Promise.all([
      getBenefitUsageHistory(),
      getPatientBenefitBalance(),
    ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Benefit Usage"
        description="Consume patient benefits, enforce limits, and review history."
        action={
          <ConsumeBenefitDialog
            balances={balances}
          />
        }
      />

      <BenefitUsageTable
        usages={usages}
      />
    </DashboardPage>
  );
}
