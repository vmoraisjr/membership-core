import { PatientProfilePage } from "@/features/patients/components/patient-profile-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

type PageProps = {
  params: Promise<{
    patientId: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { patientId } =
    await params;

  return renderOperationalClinicScopedPage(
    <PatientProfilePage
      patientId={patientId}
    />
  );
}
