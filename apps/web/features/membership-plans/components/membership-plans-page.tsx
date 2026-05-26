import { getMembershipPlans } from "../services/get-membership-plans";

import { PlansTable } from "./plans-table";

import { CreatePlanDialog } from "./create-plan-dialog";

export async function MembershipPlansPage() {
  const plans =
    await getMembershipPlans();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Membership Plans
          </h1>

          <p className="text-muted-foreground">
            Manage clinic membership plans.
          </p>
        </div>

        <CreatePlanDialog />
      </div>

      <PlansTable plans={plans} />
    </div>
  );
}