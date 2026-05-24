import { prisma } from "@/lib/prisma";

export async function getMembershipPlans() {
  return prisma.membershipPlan.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}