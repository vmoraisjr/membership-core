import { PatientsPage } from "@/features/patients/components/patients-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

// Canonical company route (Fase 6, UI-059). Content is consolidated in UI-061.
export default async function ClientesRoute() {
  return renderOperationalClinicScopedPage(
    <PatientsPage />
  );
}
