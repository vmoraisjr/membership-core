"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";

export async function updateSubscription(
  id: string,
  data: SubscriptionSchema
) {
  const parsed =
    subscriptionSchema.safeParse(
      data
    );

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  await prisma.subscription.update({
    where: {
      id,
    },

    data: {
      patientId:
        parsed.data.patientId,

      membershipPlanId:
        parsed.data
          .membershipPlanId,

      startedAt: new Date(
        parsed.data.startedAt
      ),

      expiresAt: new Date(
        parsed.data.expiresAt
      ),
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
}