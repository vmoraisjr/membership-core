import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getBenefitUsageHistory() {
  const clinic = await getCurrentClinic();

  return prisma.benefitUsage.findMany({
    where: {
      subscription: {
        patient: {
          clinicId: clinic.id,
        },
      },
    },
    select: {
      id: true,
      quantity: true,
      usedBy: true,
      usedAt: true,
      status: true,
      canceledAt: true,
      notes: true,
      subscription: {
        select: {
          id: true,
          patientId: true,
          patient: {
            select: {
              id: true,
              fullName: true,
            },
          },
          membershipPlan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      membershipBenefit: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      usedAt: "desc",
    },
  });
}
