"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function deleteMembershipPlan(
  id: string
) {
  await prisma.membershipPlan.delete({
    where: {
      id,
    },
  });

  revalidatePath("/dashboard/plans");
}