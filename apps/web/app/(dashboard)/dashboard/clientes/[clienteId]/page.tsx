import { PatientProfilePage } from "@/features/patients/components/patient-profile-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

type Props = {
  params: Promise<{
    clienteId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    returnTo?: string;
  }>;
};

// Canonical company route (Fase 6, UI-059). Tabs are consolidated in UI-062.
export default async function ClienteDetailsRoute({
  params,
  searchParams,
}: Props) {
  const { clienteId } = await params;
  const { tab, returnTo } = await searchParams;

  return renderOperationalClinicScopedPage(
    <PatientProfilePage
      patientId={clienteId}
      tab={tab}
      returnTo={returnTo}
    />
  );
}
