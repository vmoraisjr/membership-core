import { PlatformClinicDetailsPage } from "@/features/clinic/components/platform-clinic-details-page";

type Props = {
  params: Promise<{
    clinicId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    auditActor?: string;
    auditFrom?: string;
    auditTo?: string;
  }>;
};

export default async function ClinicDetailsRoute({
  params,
  searchParams,
}: Props) {
  const { clinicId } = await params;
  const {
    tab,
    auditActor,
    auditFrom,
    auditTo,
  } = await searchParams;

  return (
    <PlatformClinicDetailsPage
      clinicId={clinicId}
      activeTab={tab}
      auditFilters={{
        actor: auditActor,
        from: auditFrom,
        to: auditTo,
      }}
    />
  );
}
