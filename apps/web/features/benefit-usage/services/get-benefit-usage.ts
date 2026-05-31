import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getBenefitUsage() {
  const clinic = await getCurrentClinic();

  if (!clinic) {
    throw new Error("Clinic not found");
  }

  // TODO: Implement benefit usage retrieval
  // This will fetch BenefitUsage records for the clinic's subscriptions
  const benefitUsages = await prisma.benefitUsage.findMany({
    where: {
      subscription: {
        membershipPlan: {
          clinicId: clinic.id,
        },
      },
    },
    include: {
      subscription: {
        include: {
          patient: true,
          membershipPlan: true,
        },
      },
      membershipBenefit: true,
    },
  });

  return benefitUsages;
}
