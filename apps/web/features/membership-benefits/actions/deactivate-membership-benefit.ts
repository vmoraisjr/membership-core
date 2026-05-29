"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function deactivateMembershipBenefit(
  id: string
) {
  const clinic = await getCurrentClinic();

  const benefit =
    await prisma.membershipBenefit.findFirst({
      where: {
        id,
        membershipPlan: {
          clinicId: clinic.id,
        },
      },
      select: {
        id: true,
      },
    });

  if (!benefit) {
    throw new Error(
      "Membership benefit not found."
    );
  }

  await prisma.membershipBenefit.update({
    where: {
      id: benefit.id,
    },
    data: {
      active: false,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
}
