import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

const UPCOMING_WINDOW_DAYS = 7;

export async function getUpcomingRenewals() {
  const clinic = await getCurrentClinic();
  const now = new Date();
  const windowEnd = new Date(
    now.getTime() +
      UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const subscriptions = await prisma.subscription.findMany({
    where: {
      patient: {
        clinicId: clinic.id,
      },
      status: SubscriptionStatus.ACTIVE,
      expiresAt: {
        gte: now,
        lte: windowEnd,
      },
    },
    orderBy: {
      expiresAt: "asc",
    },
    take: 5,
    include: {
      patient: {
        select: {
          fullName: true,
        },
      },
      membershipPlan: {
        select: {
          name: true,
        },
      },
    },
  });

  return subscriptions.map((subscription) => ({
    id: subscription.id,
    patientName: subscription.patient.fullName,
    planName: subscription.membershipPlan.name,
    expiresAt: subscription.expiresAt as Date,
  }));
}
