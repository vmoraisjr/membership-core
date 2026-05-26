"use server";

import { revalidatePath } from "next/cache";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { prisma } from "@/lib/prisma";

import {
  membershipBenefitSchema,
  type MembershipBenefitSchema,
} from "../schemas/membership-benefit.schema";

export async function createMembershipBenefit(
  data: MembershipBenefitSchema
) {
  const parsed =
    membershipBenefitSchema.safeParse(
      data
    );

  if (!parsed.success) {
    throw new Error("Invalid form data.");
  }

  const clinic = await getCurrentClinic();

  const membershipPlan =
    await prisma.membershipPlan.findFirst({
      where: {
        id: parsed.data.membershipPlanId,
        clinicId: clinic.id,
      },
    });

  if (!membershipPlan) {
    throw new Error(
      "Membership plan not found for this clinic."
    );
  }

  await prisma.membershipBenefit.create({
    data: {
      membershipPlanId:
        membershipPlan.id,
      type: parsed.data.type,
      title: parsed.data.title,
      description:
        parsed.data.description,
      discountPercentage:
        parsed.data.discountPercentage,
      discountAmount:
        parsed.data.discountAmount,
      usageLimit:
        parsed.data.usageLimit,
      resetPeriod:
        parsed.data.resetPeriod || null,
    },
  });

  revalidatePath("/dashboard/benefits");
}
