import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { MembershipBenefitsPage } from "@/features/membership-benefits/components/membership-benefits-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { planoUrl, planosUrl } from "@/lib/company-routes";

type Props = {
  searchParams: Promise<{
    planId?: string;
  }>;
};

export default async function DashboardBenefitsPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(
      params.planId
        ? planoUrl(params.planId, {
            tab: "benefits",
          })
        : planosUrl()
    );
  }

  return renderOperationalClinicScopedPage(
    <MembershipBenefitsPage
      contextPlanId={params.planId}
    />
  );
}
