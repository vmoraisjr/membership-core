import { getMembershipPlans } from "../services/get-membership-plans";
import { getMembershipBenefitFormOptions } from "@/features/membership-benefits/services/get-membership-benefit-form-options";
import { getSubscriptionFormOptions } from "@/features/subscriptions/services/get-subscription-form-options";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";

import { PlansTable } from "./plans-table";

import { MembershipPlanDialog } from "./membership-plan-dialog";

export async function MembershipPlansPage() {
  const [
    plans,
    benefitPlans,
    subscriptionFormOptions,
  ] = await Promise.all([
    getMembershipPlans(),
    getMembershipBenefitFormOptions(),
    getSubscriptionFormOptions(),
  ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Membership Plans"
        description="Manage active and inactive plans, their benefits, and new subscriptions from a single screen."
        action={<MembershipPlanDialog />}
      />
      <PlansTable
        plans={plans}
        benefitPlans={benefitPlans}
        subscriptionPatients={
          subscriptionFormOptions.patients
        }
      />
    </DashboardPage>
  );
}
