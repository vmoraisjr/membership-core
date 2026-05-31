"use server";

import { revalidatePath } from "next/cache";

import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function deleteSubscriptionPermanently(
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

  if (subscription.status !== SubscriptionStatus.CANCELED) {
    throw new Error(
      "Only canceled subscriptions can be permanently deleted."
    );
  }

  await prisma.subscription.delete({
    where: {
      id: subscription.id,
    },
  });

  revalidatePath("/dashboard/subscriptions");
}
