"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

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

  const plan =
    await prisma.membershipPlan.findFirst({
      where: {
        id: parsed.data.membershipPlanId,
        clinicId: clinic.id,
        active: true,
      },
      select: {
        id: true,
      },
    });

  if (!plan) {
    throw new Error(
      "Only active clinic plans can receive benefits."
    );
  }

  await prisma.membershipBenefit.update({
    where: {
      id: benefit.id,
    },

    data: {
      membershipPlanId: plan.id,

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
