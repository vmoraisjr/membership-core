import { prisma } from "@/lib/prisma";

import { DashboardPage } from "@/components/dashboard/dashboard-page";

import { PageHeader } from "@/components/dashboard/page-header";

import { getMembershipBenefits } from "../services/get-membership-benefits";

import { MembershipBenefitsTable } from "./membership-benefit-table";

import { MembershipBenefitDialog } from "./membership-benefit-dialog";

export async function MembershipBenefitsPage() {
  const benefits =
    await getMembershipBenefits();

  const plans =
    await prisma.membershipPlan.findMany();

  return (
    <DashboardPage>
      <PageHeader
        title="Benefits"
        description="Manage membership benefits."
        action={
          <MembershipBenefitDialog
            plans={plans}
          />
        }
      />

      <MembershipBenefitsTable
        benefits={benefits}
        plans={plans}
      />
    </DashboardPage>
  );
}