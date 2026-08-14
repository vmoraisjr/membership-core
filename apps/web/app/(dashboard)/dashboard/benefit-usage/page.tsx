import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { BenefitUsageHistoryPage } from "@/features/benefit-usage/components/benefit-usage-history-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { atendimentosUrl } from "@/lib/company-routes";

// Legacy route — canonical company route is /dashboard/atendimentos (UI-059).
export default async function DashboardBenefitUsagePage() {
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(atendimentosUrl());
  }

  return renderOperationalClinicScopedPage(
    <BenefitUsageHistoryPage />
  );
}
