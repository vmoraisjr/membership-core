import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { PatientsPage } from "@/features/patients/components/patients-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { clientesUrl } from "@/lib/company-routes";

// Legacy route — canonical company route is /dashboard/clientes (UI-059).
export default async function Page() {
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(clientesUrl());
  }

  return renderOperationalClinicScopedPage(
    <PatientsPage />
  );
}
