import { DashboardPage } from "@/components/dashboard/dashboard-page";

import { PageHeader } from "@/components/dashboard/page-header";

import { getMembershipBenefits } from "../services/get-membership-benefits";
import { getMembershipBenefitFormOptions } from "../services/get-membership-benefit-form-options";

import { MembershipBenefitsTable } from "./membership-benefit-table";

import { MembershipBenefitDialog } from "./membership-benefit-dialog";

type Props = {
  contextPlanId?: string;
};

export async function MembershipBenefitsPage({
  contextPlanId,
}: Props) {
  const [benefits, plans] =
    await Promise.all([
      getMembershipBenefits(),
      getMembershipBenefitFormOptions(),
    ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Benefits"
        description={
          contextPlanId
            ? "Support screen filtered by the selected plan context."
            : "Support screen for plan-linked benefits."
        }
        action={
          <MembershipBenefitDialog
            plans={plans}
            defaultMembershipPlanId={
              contextPlanId
            }
          />
        }
      />

      <MembershipBenefitsTable
        benefits={benefits}
        plans={plans}
        selectedPlanId={contextPlanId}
      />
    </DashboardPage>
  );
}
