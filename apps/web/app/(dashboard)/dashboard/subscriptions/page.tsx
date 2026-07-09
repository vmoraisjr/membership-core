import { SubscriptionsPage } from "@/features/subscriptions/components/subscriptions-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

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

  return renderOperationalClinicScopedPage(
    <SubscriptionsPage
      contextPlanId={params.planId}
      contextPatientId={
        params.patientId
      }
    />
  );
}
