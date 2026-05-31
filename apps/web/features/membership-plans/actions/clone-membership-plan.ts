"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function cloneMembershipPlan(
  id: string
) {
  const clinic = await getCurrentClinic();

  const plan =
    await prisma.membershipPlan.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      include: {
        benefits: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const clonedPlan =
        await tx.membershipPlan.create({
          data: {
            clinicId: clinic.id,
            name: `${plan.name} Copy`,
            description:
              plan.description,
            monthlyPrice:
              plan.monthlyPrice,
            annualPrice:
              plan.annualPrice,
            active: true,
          },
        });

      if (plan.benefits.length > 0) {
        await tx.membershipBenefit.createMany({
          data: plan.benefits.map(
            (benefit) => ({
              membershipPlanId:
                clonedPlan.id,
              type: benefit.type,
              title: benefit.title,
              description:
                benefit.description,
              active: true,
              discountPercentage:
                benefit.discountPercentage,
              discountAmount:
                benefit.discountAmount,
              usageLimit:
                benefit.usageLimit,
              resetPeriod:
                benefit.resetPeriod,
            })
          ),
        });
      }
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
}
