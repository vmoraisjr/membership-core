import {
  BenefitUsageStatus,
  ResetPeriod,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

type UsageEntry = {
  subscriptionId: string;
  membershipBenefitId: string;
  quantity: number;
  usedAt: Date;
};

function isUsageInActiveWindow(
  usage: UsageEntry,
  resetPeriod: ResetPeriod | null,
  referenceDate: Date
) {
  if (resetPeriod === ResetPeriod.MONTHLY) {
    return (
      usage.usedAt.getFullYear() ===
        referenceDate.getFullYear() &&
      usage.usedAt.getMonth() ===
        referenceDate.getMonth()
    );
  }

  if (resetPeriod === ResetPeriod.YEARLY) {
    return (
      usage.usedAt.getFullYear() ===
      referenceDate.getFullYear()
    );
  }

  return true;
}

export async function getPatientBenefitBalance() {
  const clinic = await getCurrentClinic();
  const referenceDate = new Date();

  const subscriptions =
    await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        canceledAt: null,
        startedAt: {
          lte: referenceDate,
        },
        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gte: referenceDate,
            },
          },
        ],
        patient: {
          clinicId: clinic.id,
        },
        membershipPlan: {
          benefits: {
            some: {
              active: true,
            },
          },
        },
      },
      select: {
        id: true,
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
            benefits: {
              where: {
                active: true,
              },
              select: {
                id: true,
                title: true,
                usageLimit: true,
                resetPeriod: true,
              },
              orderBy: {
                title: "asc",
              },
            },
          },
        },
      },
      orderBy: [
        {
          patient: {
            fullName: "asc",
          },
        },
        {
          startedAt: "desc",
        },
      ],
    });

  const subscriptionIds =
    subscriptions.map(
      (subscription) => subscription.id
    );

  const usages =
    subscriptionIds.length === 0
      ? []
      : await prisma.benefitUsage.findMany({
          where: {
            subscriptionId: {
              in: subscriptionIds,
            },
            status:
              BenefitUsageStatus.ACTIVE,
          },
          select: {
            subscriptionId: true,
            membershipBenefitId: true,
            quantity: true,
            usedAt: true,
          },
        });

  return subscriptions.flatMap(
    (subscription) =>
      subscription.membershipPlan.benefits.map(
        (benefit) => {
          const relevantUsages =
            usages.filter(
              (usage) =>
                usage.subscriptionId ===
                  subscription.id &&
                usage.membershipBenefitId ===
                  benefit.id &&
                isUsageInActiveWindow(
                  usage,
                  benefit.resetPeriod,
                  referenceDate
                )
            );

          const usedQuantity =
            relevantUsages.reduce(
              (total, usage) =>
                total + usage.quantity,
              0
            );

          const remainingQuantity =
            benefit.usageLimit == null
              ? null
              : Math.max(
                  benefit.usageLimit -
                    usedQuantity,
                  0
                );

          return {
            subscriptionId:
              subscription.id,
            patientId:
              subscription.patient.id,
            patientName:
              subscription.patient.fullName,
            membershipPlanId:
              subscription.membershipPlan.id,
            membershipPlanName:
              subscription.membershipPlan.name,
            membershipBenefitId:
              benefit.id,
            membershipBenefitTitle:
              benefit.title,
            usageLimit:
              benefit.usageLimit,
            resetPeriod:
              benefit.resetPeriod,
            usedQuantity,
            remainingQuantity,
          };
        }
      )
  );
}
