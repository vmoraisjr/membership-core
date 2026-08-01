import { PlatformSaasPaymentsPage } from "@/features/billing/components/platform-saas-payments-page";

type Props = {
  searchParams: Promise<{
    clinicId?: string;
    planId?: string;
    status?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const params = await searchParams;

  return (
    <PlatformSaasPaymentsPage
      filters={{
        clinicId: params.clinicId,
        planId: params.planId,
        status: params.status,
      }}
    />
  );
}
