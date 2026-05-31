import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getMembershipBenefits() {
  const clinic = await getCurrentClinic();

  return prisma.membershipBenefit.findMany({
    where: {
      membershipPlan: {
        clinicId: clinic.id,
      },
    },
    include: {
      membershipPlan: true,
    },
    orderBy: {
      title: "asc",
    },
  });
}
