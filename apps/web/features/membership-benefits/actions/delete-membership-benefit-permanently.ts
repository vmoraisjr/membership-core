"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function deleteMembershipBenefitPermanently(
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
        _count: {
          select: {
            usages: true,
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
      "Only inactive benefits can be permanently deleted."
    );
  }

  if (
    benefit._count.usages > 0
  ) {
    throw new Error(
      "This benefit has usage history and cannot be permanently deleted."
    );
  }

  await prisma.membershipBenefit.delete({
    where: {
      id: benefit.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
}
