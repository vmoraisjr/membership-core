import { ClinicPage } from "@/features/clinic/components/clinic-page";

type Props = {
  searchParams: Promise<{
    planId?: string;
  }>;
};

export default async function EmpresasRoute({
  searchParams,
}: Props) {
  const { planId } = await searchParams;

  return <ClinicPage planId={planId} />;
}
