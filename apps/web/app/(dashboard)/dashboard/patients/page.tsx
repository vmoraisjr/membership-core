import { PatientsPage } from "@/features/patients/components/patients-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

export default async function Page() {
  return renderOperationalClinicScopedPage(
    <PatientsPage />
  );
}
