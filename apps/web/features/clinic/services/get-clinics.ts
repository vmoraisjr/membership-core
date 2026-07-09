import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

import prisma from "@/lib/prisma";

export async function getClinics() {
  const currentUser =
    await requireCurrentAppUser();

  if (!currentUser.clinicId) {
    if (
      currentUser.role !== "OWNER" &&
      currentUser.role !== "ADMIN"
    ) {
      return [];
    }

    return prisma.clinic.findMany({
      include: {
        _count: {
          select: {
            patients: true,
            membershipPlans: true,
          },
        },
        clinicSubscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            clinicBillingPlan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
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
        clinicSubscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            clinicBillingPlan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    orderBy: {
      createdAt: "desc",
    },
  });
}
