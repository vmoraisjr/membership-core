import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { SubscriptionsPage } from "@/features/subscriptions/components/subscriptions-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { clienteUrl, clientesUrl } from "@/lib/company-routes";

type Props = {
  searchParams: Promise<{
    planId?: string;
    patientId?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const params = await searchParams;
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(
      params.patientId
        ? clienteUrl(params.patientId, {
            tab: "membership",
          })
        : clientesUrl({
            planId: params.planId,
          })
    );
  }

  return renderOperationalClinicScopedPage(
    <SubscriptionsPage
      contextPlanId={params.planId}
      contextPatientId={
        params.patientId
      }
    />
  );
}
