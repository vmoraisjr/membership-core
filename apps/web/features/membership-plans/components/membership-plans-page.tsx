import { getMembershipPlans } from "../services/get-membership-plans";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";

import { PlansTable } from "./plans-table";

import { CreatePlanDialog } from "./create-plan-dialog";

export async function MembershipPlansPage() {
  const plans =
    await getMembershipPlans();

  return (
    <DashboardPage>
      <PageHeader
        title="Membership Plans"
        description="Configure the plans your clinic sells, along with pricing foundations that downstream subscriptions can reference."
        action={<CreatePlanDialog />}
      />
      <PlansTable plans={plans} />
    </DashboardPage>
  );
}
