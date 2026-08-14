import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { PatientPaymentsPage } from "@/features/billing/components/patient-payments-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { cobrancasUrl } from "@/lib/company-routes";

// Legacy route — canonical company route is /dashboard/cobrancas (UI-059).
export default async function Page() {
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(cobrancasUrl());
  }

  return renderOperationalClinicScopedPage(
    <PatientPaymentsPage />
  );
}
