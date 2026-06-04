"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import {
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function cancelSubscription(
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
    SubscriptionStatus.CANCELED
  ) {
    throw new Error(
      "Subscription is already canceled."
    );
  }

  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },

    data: {
      // Subscriptions are canceled instead of deleted to preserve audit and billing history.
      status:
        SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
}
