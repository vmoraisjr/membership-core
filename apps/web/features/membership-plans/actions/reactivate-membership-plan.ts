"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function reactivateMembershipPlan(
  id: string
) {
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
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  if (plan.active) {
    throw new Error(
      "Membership plan is already active."
    );
  }

  await prisma.membershipPlan.update({
    where: {
      id: plan.id,
    },
    data: {
      active: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
  revalidatePath("/dashboard/subscriptions");
}
