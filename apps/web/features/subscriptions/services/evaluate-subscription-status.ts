import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

type SubscriptionStatusEvaluation = {
  id: string;
  currentStatus: SubscriptionStatus;
  evaluatedStatus: SubscriptionStatus;
  changed: boolean;
};

export async function evaluateSubscriptionStatus(
  subscriptionId: string
): Promise<SubscriptionStatusEvaluation> {
  const clinic = await getCurrentClinic();

  const subscription =
    await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
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
    throw new Error("Subscription not found.");
  }

  const nextStatus =
    getEvaluatedSubscriptionStatus({
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      status: subscription.status,
    });

  if (nextStatus !== subscription.status) {
    await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: nextStatus,
      },
    });
  }

  return {
    id: subscription.id,
    currentStatus: subscription.status,
    evaluatedStatus: nextStatus,
    changed: nextStatus !== subscription.status,
  };
}

export function getEvaluatedSubscriptionStatus({
  startedAt,
  expiresAt,
  status,
}: {
  startedAt: Date;
  expiresAt: Date | null;
  status: SubscriptionStatus;
}) {
  if (
    status === SubscriptionStatus.CANCELED ||
    status === SubscriptionStatus.EXPIRED ||
    status === SubscriptionStatus.PAUSED
  ) {
    return status;
  }

  if (!expiresAt) {
    return startedAt.getTime() > Date.now()
      ? SubscriptionStatus.PENDING
      : SubscriptionStatus.ACTIVE;
  }

  if (expiresAt.getTime() < Date.now()) {
    return SubscriptionStatus.OVERDUE;
  }

  if (startedAt.getTime() > Date.now()) {
    return SubscriptionStatus.PENDING;
  }

  return SubscriptionStatus.ACTIVE;
}
