import { redirect } from "next/navigation";

import { empresaUrl } from "@/lib/owner-routes";

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

// Legacy route — canonical is /dashboard/empresas/[empresaId] (UI-049).
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

  redirect(
    empresaUrl(clinicId, {
      tab,
      auditActor,
      auditFrom,
      auditTo,
    })
  );
}
