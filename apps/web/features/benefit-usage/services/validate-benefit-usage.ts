import {
  ResetPeriod,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

type ValidateBenefitUsageInput = {
  subscriptionId: string;
  membershipBenefitId: string;
  quantity: number;
  usedAt?: Date;
};

type UsageWindow = {
  start: Date | null;
  end: Date | null;
};

function getUsageWindow(
  usedAt: Date,
  resetPeriod: ResetPeriod | null
): UsageWindow {
  if (resetPeriod === ResetPeriod.MONTHLY) {
    const start = new Date(
      usedAt.getFullYear(),
      usedAt.getMonth(),
      1
    );
    const end = new Date(
      usedAt.getFullYear(),
      usedAt.getMonth() + 1,
      1
    );

    return {
      start,
      end,
    };
  }

  if (resetPeriod === ResetPeriod.YEARLY) {
    const start = new Date(
      usedAt.getFullYear(),
      0,
      1
    );
    const end = new Date(
      usedAt.getFullYear() + 1,
      0,
      1
    );

    return {
      start,
      end,
    };
  }

  return {
    start: null,
    end: null,
  };
}

export async function validateBenefitUsage({
  subscriptionId,
  membershipBenefitId,
  quantity,
  usedAt = new Date(),
}: ValidateBenefitUsageInput) {
  const clinic = await getCurrentClinic();

  const subscription =
    await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        status: SubscriptionStatus.ACTIVE,
        canceledAt: null,
        patient: {
          clinicId: clinic.id,
        },
        startedAt: {
          lte: usedAt,
        },
        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gte: usedAt,
            },
          },
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
        membershipPlan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  if (!subscription) {
    throw new Error(
      "Only active subscriptions can consume benefits."
    );
  }

  const benefit =
    await prisma.membershipBenefit.findFirst({
      where: {
        id: membershipBenefitId,
        membershipPlanId:
          subscription.membershipPlanId,
        active: true,
      },
      select: {
        id: true,
        title: true,
        usageLimit: true,
        resetPeriod: true,
        membershipPlanId: true,
      },
    });

  if (!benefit) {
    throw new Error(
      "This benefit does not belong to the subscription plan."
    );
  }

  const usageWindow = getUsageWindow(
    usedAt,
    benefit.resetPeriod
  );

  const usageFilter =
    usageWindow.start &&
    usageWindow.end
      ? {
          gte: usageWindow.start,
          lt: usageWindow.end,
        }
      : undefined;

  const usageAggregate =
    await prisma.benefitUsage.aggregate({
      where: {
        subscriptionId,
        membershipBenefitId,
        ...(usageFilter
          ? {
              usedAt: usageFilter,
            }
          : {}),
      },
      _sum: {
        quantity: true,
      },
    });

  const usedQuantity =
    usageAggregate._sum.quantity ?? 0;

  const remainingQuantity =
    benefit.usageLimit == null
      ? null
      : benefit.usageLimit -
        usedQuantity;

  if (
    remainingQuantity != null &&
    quantity > remainingQuantity
  ) {
    throw new Error(
      "Benefit usage limit exceeded for the current reset period."
    );
  }

  return {
    subscription,
    benefit,
    usedQuantity,
    remainingQuantity,
    usageWindow,
  };
}
