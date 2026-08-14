import { BenefitUsageHistoryPage } from "@/features/benefit-usage/components/benefit-usage-history-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

// Canonical company route (Fase 6, UI-059). Content is refined in UI-065.
export default async function AtendimentosRoute() {
  return renderOperationalClinicScopedPage(
    <BenefitUsageHistoryPage />
  );
}
