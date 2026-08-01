import { PlatformSaasSubscriptionsPage } from "@/features/billing/components/platform-saas-subscriptions-page";

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
    <PlatformSaasSubscriptionsPage
      filters={{
        clinicId: params.clinicId,
        planId: params.planId,
        status: params.status,
      }}
    />
  );
}
