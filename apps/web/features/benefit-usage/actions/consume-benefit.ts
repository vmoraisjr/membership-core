"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

import {
  benefitUsageSchema,
  type BenefitUsageSchema,
} from "../schemas/benefit-usage.schema";
import { validateBenefitUsage } from "../services/validate-benefit-usage";

export async function consumeBenefit(
  data: BenefitUsageSchema
) {
  await assertPermission(
    "benefitUsage",
    "manage"
  );

  const parsed =
    benefitUsageSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      "Invalid benefit usage data."
    );
  }

  const validated =
    await validateBenefitUsage({
      subscriptionId:
        parsed.data.subscriptionId,
      membershipBenefitId:
        parsed.data
          .membershipBenefitId,
      quantity: parsed.data.quantity,
    });

  await prisma.benefitUsage.create({
    data: {
      subscriptionId:
        validated.subscription.id,
      membershipBenefitId:
        validated.benefit.id,
      quantity: parsed.data.quantity,
      usedBy: parsed.data.usedBy,
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/dashboard/benefit-usage");
  revalidatePath("/dashboard/subscriptions");
}
