"use server";

import { revalidatePath } from "next/cache";

import {
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";

export async function createSubscription(
  data: SubscriptionSchema
) {
  const parsed =
    subscriptionSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  await prisma.subscription.create({
    data: {
      patientId: parsed.data.patientId,

      membershipPlanId:
        parsed.data.membershipPlanId,

      startedAt: new Date(
        parsed.data.startedAt
      ),

      expiresAt: new Date(
        parsed.data.expiresAt
      ),

      status:
        SubscriptionStatus.ACTIVE,
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
}