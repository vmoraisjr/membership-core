"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import {
  membershipBenefitSchema,
  type MembershipBenefitSchema,
} from "../schemas/membership-benefit.schema";

export async function updateMembershipBenefit(
  id: string,
  data: MembershipBenefitSchema
) {
  const parsed =
    membershipBenefitSchema.safeParse(
      data
    );

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  await prisma.membershipBenefit.update({
    where: {
      id,
    },

    data: {
      membershipPlanId:
        parsed.data.membershipPlanId,

      type: parsed.data.type,

      title: parsed.data.title,

      description:
        parsed.data.description,

      discountPercentage:
        parsed.data
          .discountPercentage,

      discountAmount:
        parsed.data.discountAmount,

      usageLimit:
        parsed.data.usageLimit,

      resetPeriod:
        parsed.data.resetPeriod ||
        null,
    },
  });

  revalidatePath(
    "/dashboard/benefits"
  );
}