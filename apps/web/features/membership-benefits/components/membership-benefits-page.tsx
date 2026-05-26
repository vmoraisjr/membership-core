import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";

import { getMembershipBenefitFormOptions } from "../services/get-membership-benefit-form-options";
import { getMembershipBenefits } from "../services/get-membership-benefits";

import { CreateMembershipBenefitDialog } from "./create-membership-benefit-dialog";
import { MembershipBenefitsTable } from "./membership-benefits-table";

export async function MembershipBenefitsPage() {
  const [benefits, membershipPlans] =
    await Promise.all([
      getMembershipBenefits(),
      getMembershipBenefitFormOptions(),
    ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Membership Benefits"
        description="Define the actual value inside each plan, from discounts to limited usage perks."
        action={
          <CreateMembershipBenefitDialog
            membershipPlans={
              membershipPlans
            }
          />
        }
      />

      <MembershipBenefitsTable
        benefits={benefits}
      />
    </DashboardPage>
  );
}
