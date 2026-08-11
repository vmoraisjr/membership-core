import { MembershipPlanDetailsPage } from "@/features/membership-plans/components/membership-plan-details-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

type PageProps = {
  params: Promise<{
    planId: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { planId } = await params;

  return renderOperationalClinicScopedPage(
    <MembershipPlanDetailsPage
      planId={planId}
    />
  );
}
