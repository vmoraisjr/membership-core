import { MembershipPlanDetailsPage } from "@/features/membership-plans/components/membership-plan-details-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

type Props = {
  params: Promise<{
    planoId: string;
  }>;
};

// Canonical company route (Fase 6, UI-059). Tabs are consolidated in UI-063.
export default async function PlanoDetailsRoute({
  params,
}: Props) {
  const { planoId } = await params;

  return renderOperationalClinicScopedPage(
    <MembershipPlanDetailsPage planId={planoId} />
  );
}
