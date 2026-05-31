"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function reactivateMembershipBenefit(
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
        active: true,
        membershipPlan: {
          select: {
            active: true,
          },
        },
      },
    });

  if (!benefit) {
    throw new Error(
      "Membership benefit not found."
    );
  }

  if (benefit.active) {
    throw new Error(
      "Membership benefit is already active."
    );
  }

  if (
    !benefit.membershipPlan.active
  ) {
    throw new Error(
      "Reactivate the membership plan before reactivating this benefit."
    );
  }

  await prisma.membershipBenefit.update({
    where: {
      id: benefit.id,
    },
    data: {
      active: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
}
