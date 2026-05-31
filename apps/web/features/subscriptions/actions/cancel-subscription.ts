"use server";

import { revalidatePath } from "next/cache";

import {
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function cancelSubscription(
  id: string
) {
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
      },
    });

  if (!subscription) {
    throw new Error(
      "Subscription not found."
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
    "/dashboard/patients"
  );
  revalidatePath("/dashboard/plans");
  revalidatePath(
    "/dashboard/subscriptions"
  );
}
