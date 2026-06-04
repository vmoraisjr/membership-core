import prisma from "@/lib/prisma";

export async function getClinics() {
  return prisma.clinic.findMany({
    include: {
      _count: {
        select: {
          patients: true,
          membershipPlans: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
