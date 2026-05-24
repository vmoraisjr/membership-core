import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";

import { CreatePlanDialog } from "@/features/membership-plans/components/create-plan-dialog";

import { PlansTable } from "@/features/membership-plans/components/plans-table";

export default async function PlansPage() {
  const plans = await getMembershipPlans();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
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
    </main>
  );
}