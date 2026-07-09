import { MembershipPlansPage } from "@/features/membership-plans/components/membership-plans-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

export default async function PlansPage() {
  return renderOperationalClinicScopedPage(
    <MembershipPlansPage />
  );
}
