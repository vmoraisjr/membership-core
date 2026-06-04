"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

import {
  membershipPlanSchema,
  type MembershipPlanSchema,
} from "../schemas/membership-plan.schema";

export async function updateMembershipPlan(
  id: string,
  data: MembershipPlanSchema
) {
  await assertPermission(
    "plans",
    "manage"
  );

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
