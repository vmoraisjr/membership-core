import { PatientPaymentsPage } from "@/features/billing/components/patient-payments-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

// Canonical company route (Fase 6, UI-059). Content is refined in UI-064.
export default async function CobrancasRoute() {
  return renderOperationalClinicScopedPage(
    <PatientPaymentsPage />
  );
}
