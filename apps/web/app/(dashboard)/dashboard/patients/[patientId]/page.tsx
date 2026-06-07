import { PatientProfilePage } from "@/features/patients/components/patient-profile-page";

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

  return (
    <PatientProfilePage
      patientId={patientId}
    />
  );
}
