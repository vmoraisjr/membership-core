import { PlatformClinicDetailsPage } from "@/features/clinic/components/platform-clinic-details-page";

type Props = {
  params: Promise<{
    empresaId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    auditActor?: string;
    auditFrom?: string;
    auditTo?: string;
    threadId?: string;
    category?: string;
    status?: string;
  }>;
};

export default async function EmpresaDetailsRoute({
  params,
  searchParams,
}: Props) {
  const { empresaId } = await params;
  const {
    tab,
    auditActor,
    auditFrom,
    auditTo,
    threadId,
    category,
    status,
  } = await searchParams;

  return (
    <PlatformClinicDetailsPage
      clinicId={empresaId}
      activeTab={tab}
      auditFilters={{
        actor: auditActor,
        from: auditFrom,
        to: auditTo,
      }}
      chamadosFilters={{
        threadId,
        category,
        status,
      }}
    />
  );
}
