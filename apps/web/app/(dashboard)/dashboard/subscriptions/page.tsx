import { SubscriptionsPage } from "@/features/subscriptions/components/subscriptions-page";

type Props = {
  searchParams: Promise<{
    planId?: string;
    patientId?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const params = await searchParams;

  return (
    <SubscriptionsPage
      contextPlanId={params.planId}
      contextPatientId={
        params.patientId
      }
    />
  );
}
