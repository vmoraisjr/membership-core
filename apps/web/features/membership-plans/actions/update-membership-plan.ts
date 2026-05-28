"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import {
  membershipPlanSchema,
  type MembershipPlanSchema,
} from "../schemas/membership-plan.schema";

export async function updateMembershipPlan(
  id: string,
  data: MembershipPlanSchema
) {
  const parsed =
    membershipPlanSchema.safeParse(
      data
    );

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  await prisma.membershipPlan.update({
    where: {
      id,
    },

    data: {
      name: parsed.data.name,

      description:
        parsed.data.description,

      monthlyPrice:
        parsed.data.monthlyPrice,
    },
  });

  revalidatePath("/dashboard/plans");
}