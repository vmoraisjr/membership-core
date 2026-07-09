import { PatientPaymentsPage } from "@/features/billing/components/patient-payments-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

export default async function Page() {
  return renderOperationalClinicScopedPage(
    <PatientPaymentsPage />
  );
}
