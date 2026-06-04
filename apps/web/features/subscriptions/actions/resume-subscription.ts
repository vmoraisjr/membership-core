"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import { getEvaluatedSubscriptionStatus } from "../services/evaluate-subscription-status";

export async function resumeSubscription(
  id: string
) {
  await assertPermission(
    "subscriptions",
    "manage"
  );

  const clinic = await getCurrentClinic();

  const subscription =
    await prisma.subscription.findFirst({
      where: {
        id,
        patient: {
          clinicId: clinic.id,
        },
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        expiresAt: true,
      },
    });

  if (!subscription) {
    throw new Error(
      "Subscription not found."
    );
  }

  if (
    subscription.status !==
    SubscriptionStatus.PAUSED
  ) {
    throw new Error(
      "Only paused subscriptions can be resumed."
    );
  }

  const nextStatus =
    getEvaluatedSubscriptionStatus({
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      status: SubscriptionStatus.ACTIVE,
    });

  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status: nextStatus,
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
}
