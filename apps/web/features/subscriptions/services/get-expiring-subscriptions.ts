import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

type GetExpiringSubscriptionsOptions = {
  daysAhead?: number;
};

export async function getExpiringSubscriptions({
  daysAhead = 7,
}: GetExpiringSubscriptionsOptions = {}) {
  const clinic = await getCurrentClinic();
  const now = new Date();
  const upperBound = new Date(
    now.getTime() +
      daysAhead * 24 * 60 * 60 * 1000
  );

  return prisma.subscription.findMany({
    where: {
      patient: {
        clinicId: clinic.id,
      },
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.OVERDUE,
        ],
      },
      expiresAt: {
        not: null,
        gte: now,
        lte: upperBound,
      },
    },
    include: {
      patient: true,
      membershipPlan: true,
    },
    orderBy: {
      expiresAt: "asc",
    },
  });
}
