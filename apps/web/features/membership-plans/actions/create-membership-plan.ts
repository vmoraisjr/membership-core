"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

import {
  membershipPlanSchema,
  type MembershipPlanSchema,
} from "../schemas/membership-plan.schema";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";


export async function createMembershipPlan(
  data: MembershipPlanSchema
) {
  const parsed =
    membershipPlanSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid form data.");
  }

  const clinic = await getCurrentClinic();

  await prisma.membershipPlan.create({
    data: {
      clinicId: clinic.id,

      name: parsed.data.name,

      description: parsed.data.description,

      monthlyPrice: parsed.data.monthlyPrice,

      active: true,
    },
  });

  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard");
}
