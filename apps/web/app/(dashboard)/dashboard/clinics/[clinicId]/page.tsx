import { PlatformClinicDetailsPage } from "@/features/clinic/components/platform-clinic-details-page";

type Props = {
  params: Promise<{
    clinicId: string;
  }>;
};

export default async function ClinicDetailsRoute({
  params,
}: Props) {
  const { clinicId } = await params;

  return (
    <PlatformClinicDetailsPage
      clinicId={clinicId}
    />
  );
}
