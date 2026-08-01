import { PlatformClinicDetailsPage } from "@/features/clinic/components/platform-clinic-details-page";

type Props = {
  params: Promise<{
    clinicId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function ClinicDetailsRoute({
  params,
  searchParams,
}: Props) {
  const { clinicId } = await params;
  const { tab } = await searchParams;

  return (
    <PlatformClinicDetailsPage
      clinicId={clinicId}
      activeTab={tab}
    />
  );
}
