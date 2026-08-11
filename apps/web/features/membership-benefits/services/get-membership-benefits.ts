import { BenefitUsageStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getMembershipBenefits() {
  const clinic = await getCurrentClinic();
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const benefits =
    await prisma.membershipBenefit.findMany({
      where: {
        membershipPlan: {
          clinicId: clinic.id,
        },
      },
      include: {
        membershipPlan: true,
        _count: {
          select: {
            usages: {
              where: {
                status:
                  BenefitUsageStatus.ACTIVE,
                usedAt: {
                  gte: startOfMonth,
                },
              },
            },
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

  return benefits.map((benefit) => ({
    ...benefit,
    usedThisMonth: benefit._count.usages,
  }));
}
