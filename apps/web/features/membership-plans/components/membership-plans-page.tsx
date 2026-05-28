import { getMembershipPlans } from "../services/get-membership-plans";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";

import { PlansTable } from "./plans-table";

import { MembershipPlanDialog } from "./membership-plan-dialog";

export async function MembershipPlansPage() {
  const plans =
    await getMembershipPlans();

  return (
    <DashboardPage>
      <PageHeader
        title="Membership Plans"
        description="Manage clinic membership plans."
        action={<MembershipPlanDialog  />}
      />
      <PlansTable plans={plans} />
    </DashboardPage>
  );
}
