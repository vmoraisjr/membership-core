"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function expireSubscription(
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
      },
    });

  if (!subscription) {
    throw new Error(
      "Subscription not found."
    );
  }

  if (
    subscription.status ===
      SubscriptionStatus.CANCELED ||
    subscription.status ===
      SubscriptionStatus.EXPIRED
  ) {
    throw new Error(
      "Only active lifecycle subscriptions can be expired."
    );
  }

  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status: SubscriptionStatus.EXPIRED,
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
}
