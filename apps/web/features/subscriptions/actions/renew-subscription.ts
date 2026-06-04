"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import { getEvaluatedSubscriptionStatus } from "../services/evaluate-subscription-status";

type RenewSubscriptionInput = {
  days?: number;
};

export async function renewSubscription(
  id: string,
  input: RenewSubscriptionInput = {}
) {
  await assertPermission(
    "subscriptions",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const days = input.days ?? 30;

  if (days <= 0) {
    throw new Error(
      "Renewal days must be greater than zero."
    );
  }

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
    subscription.status ===
    SubscriptionStatus.CANCELED
  ) {
    throw new Error(
      "Canceled subscriptions cannot be renewed."
    );
  }

  const referenceDate =
    subscription.expiresAt &&
    subscription.expiresAt.getTime() >
      Date.now()
      ? subscription.expiresAt
      : new Date();

  const renewedExpirationDate =
    new Date(referenceDate);

  renewedExpirationDate.setDate(
    renewedExpirationDate.getDate() +
      days
  );

  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      expiresAt: renewedExpirationDate,
      status:
        getEvaluatedSubscriptionStatus({
          startedAt:
            subscription.startedAt,
          expiresAt:
            renewedExpirationDate,
          status:
            SubscriptionStatus.ACTIVE,
        }),
      canceledAt: null,
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
}
