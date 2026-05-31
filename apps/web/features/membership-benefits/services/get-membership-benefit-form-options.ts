import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getMembershipBenefitFormOptions() {
  const clinic = await getCurrentClinic();

  return prisma.membershipPlan.findMany({
    where: {
      clinicId: clinic.id,
      active: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });
}
