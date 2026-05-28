import { prisma } from "@/lib/prisma";

export async function getSubscriptions() {
  return prisma.subscription.findMany({
    include: {
      patient: true,

      membershipPlan: true,
    },

    orderBy: {
      startedAt: "desc",
    },
  });
}