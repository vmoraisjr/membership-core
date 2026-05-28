"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function deleteMembershipBenefit(
  id: string
) {
  await prisma.membershipBenefit.delete({
    where: {
      id,
    },
  });

  revalidatePath(
    "/dashboard/benefits"
  );
}