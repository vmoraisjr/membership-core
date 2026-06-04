"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";

export async function deactivateMembershipPlan(
  id: string,
  confirmationName: string
) {
  await assertPermission(
    "plans",
    "manage"
  );

  const clinic = await getCurrentClinic();

  const plan =
    await prisma.membershipPlan.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  if (plan.name !== confirmationName) {
    throw new Error(
      "Type the plan name exactly to confirm cancellation."
    );
  }

  if (!plan.active) {
    throw new Error(
      "Membership plan is already inactive."
    );
  }

  const canceledAt = new Date();

  await prisma.$transaction([
    prisma.membershipPlan.update({
      where: {
        id: plan.id,
      },
      data: {
        active: false,
      },
    }),
    prisma.membershipBenefit.updateMany({
      where: {
        membershipPlanId: plan.id,
      },
      data: {
        active: false,
      },
    }),
    prisma.subscription.updateMany({
      where: {
        membershipPlanId: plan.id,
        status: {
          in: [
            ...MANAGEABLE_SUBSCRIPTION_STATUSES,
          ],
        },
      },
      data: {
        status:
          SubscriptionStatus.CANCELED,
        canceledAt,
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/subscriptions");
}
