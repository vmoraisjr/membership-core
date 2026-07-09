import { BenefitUsageHistoryPage } from "@/features/benefit-usage/components/benefit-usage-history-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

export default async function DashboardBenefitUsagePage() {
  return renderOperationalClinicScopedPage(
    <BenefitUsageHistoryPage />
  );
}
