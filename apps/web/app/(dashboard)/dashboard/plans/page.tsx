import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { MembershipPlansPage } from "@/features/membership-plans/components/membership-plans-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { planosUrl } from "@/lib/company-routes";

// Legacy route — canonical company route is /dashboard/planos (UI-059).
export default async function PlansPage() {
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(planosUrl());
  }

  return renderOperationalClinicScopedPage(
    <MembershipPlansPage />
  );
}
