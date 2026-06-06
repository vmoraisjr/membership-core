import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

import prisma from "@/lib/prisma";

export async function getClinics() {
  const currentUser =
    await requireCurrentAppUser();

  if (!currentUser.clinicId) {
    return [];
  }

  return prisma.clinic.findMany({
    where: {
      id: currentUser.clinicId,
    },
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
