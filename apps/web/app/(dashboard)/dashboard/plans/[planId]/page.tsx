import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { MembershipPlanDetailsPage } from "@/features/membership-plans/components/membership-plan-details-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { planoUrl } from "@/lib/company-routes";

type PageProps = {
  params: Promise<{
    planId: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { planId } = await params;
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(planoUrl(planId));
  }

  return renderOperationalClinicScopedPage(
    <MembershipPlanDetailsPage
      planId={planId}
    />
  );
}
