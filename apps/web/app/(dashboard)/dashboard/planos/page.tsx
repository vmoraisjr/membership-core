import { MembershipPlansPage } from "@/features/membership-plans/components/membership-plans-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

// Canonical company route (Fase 6, UI-059). Content is consolidated in UI-063.
export default async function PlanosRoute() {
  return renderOperationalClinicScopedPage(
    <MembershipPlansPage />
  );
}
