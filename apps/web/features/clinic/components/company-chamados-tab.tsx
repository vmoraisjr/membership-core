import { SupportThreadsPage } from "@/features/messages/components/support-threads-page";
import { empresaUrl } from "@/lib/owner-routes";

type Props = {
  clinicId: string;
  clinicName: string;
  filters: {
    threadId?: string;
    category?: string;
    status?: string;
  };
};

export async function CompanyChamadosTab({
  clinicId,
  clinicName,
  filters,
}: Props) {
  return (
    <SupportThreadsPage
      filters={{
        ...filters,
        clinicId,
      }}
      scope={{
        type: "company",
        clinicId,
        clinicName,
        returnBase: empresaUrl(clinicId, {
          tab: "chamados",
        }),
      }}
    />
  );
}
