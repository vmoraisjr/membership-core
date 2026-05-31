"use server";

import { revalidatePath } from "next/cache";

import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function reactivateSubscription(
  id: string
) {
  const clinic = await getCurrentClinic();

  const subscription = await prisma.subscription.findFirst({
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
    throw new Error("Subscription not found.");
  }

  if (subscription.status === SubscriptionStatus.ACTIVE) {
    throw new Error("Subscription is already active.");
  }

  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status: SubscriptionStatus.ACTIVE,
      canceledAt: null,
    },
  });

  revalidatePath("/dashboard/subscriptions");
}
