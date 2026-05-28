"use server";

import { revalidatePath } from "next/cache";

import {
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function cancelSubscription(
  id: string
) {
  await prisma.subscription.update({
    where: {
      id,
    },

    data: {
      status:
        SubscriptionStatus.CANCELED,
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
}