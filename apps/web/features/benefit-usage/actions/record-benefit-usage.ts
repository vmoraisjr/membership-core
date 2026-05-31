"use server";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import {
  benefitUsageSchema,
  type BenefitUsageSchema,
} from "../schemas/benefit-usage.schema";

export async function recordBenefitUsage(
  values: BenefitUsageSchema
) {
  const clinic = await getCurrentClinic();

  if (!clinic) {
    throw new Error("Clinic not found");
  }

  const parsed = benefitUsageSchema.safeParse(values);

  if (!parsed.success) {
    throw new Error("Invalid benefit usage data");
  }

  // Verify subscription exists and belongs to clinic
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: parsed.data.subscriptionId,
      membershipPlan: {
        clinicId: clinic.id,
      },
    },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Verify benefit exists
  const benefit = await prisma.membershipBenefit.findUnique({
    where: {
      id: parsed.data.membershipBenefitId,
    },
  });

  if (!benefit) {
    throw new Error("Benefit not found");
  }

  // TODO: Implement usage limit validation and reset period logic

  const benefitUsage = await prisma.benefitUsage.create({
    data: {
      subscriptionId: parsed.data.subscriptionId,
      membershipBenefitId: parsed.data.membershipBenefitId,
      usedBy: parsed.data.usedBy,
      notes: parsed.data.notes,
    },
    include: {
      subscription: {
        include: {
          patient: true,
          membershipPlan: true,
        },
      },
      membershipBenefit: true,
    },
  });

  return benefitUsage;
}
