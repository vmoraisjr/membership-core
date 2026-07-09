import { MembershipBenefitsPage } from "@/features/membership-benefits/components/membership-benefits-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

type Props = {
  searchParams: Promise<{
    planId?: string;
  }>;
};

export default async function DashboardBenefitsPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  return renderOperationalClinicScopedPage(
    <MembershipBenefitsPage
      contextPlanId={params.planId}
    />
  );
}
