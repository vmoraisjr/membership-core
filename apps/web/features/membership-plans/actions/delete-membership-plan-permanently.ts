"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function deleteMembershipPlanPermanently(
  id: string
) {
  await assertPermission(
    "plans",
    "manage"
  );

  const clinic = await getCurrentClinic();

  const plan =
    await prisma.membershipPlan.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        active: true,
        _count: {
          select: {
            benefits: true,
            subscriptions: true,
          },
        },
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  if (plan.active) {
    throw new Error(
      "Only inactive membership plans can be permanently deleted."
    );
  }

  if (
    plan._count.subscriptions > 0
  ) {
    throw new Error(
      "This plan has subscription history and cannot be permanently deleted."
    );
  }

  await prisma.$transaction([
    prisma.membershipBenefit.deleteMany({
      where: {
        membershipPlanId: plan.id,
      },
    }),
    prisma.membershipPlan.delete({
      where: {
        id: plan.id,
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
  revalidatePath("/dashboard/subscriptions");
}
