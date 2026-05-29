import { MembershipBenefitsPage } from "@/features/membership-benefits/components/membership-benefit-page";

type Props = {
  searchParams: Promise<{
    planId?: string;
  }>;
};

export default async function DashboardBenefitsPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  return (
    <MembershipBenefitsPage
      contextPlanId={params.planId}
    />
  );
}
