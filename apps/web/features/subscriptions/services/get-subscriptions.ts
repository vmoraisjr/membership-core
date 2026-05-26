import { prisma } from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getSubscriptions() {
  const clinic = await getCurrentClinic();

  return prisma.subscription.findMany({
    where: {
      patient: {
        clinicId: clinic.id,
      },
    },
    include: {
      patient: true,
      membershipPlan: true,
    },
    orderBy: {
      startedAt: "desc",
    },
  });
}
