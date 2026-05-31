import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getDashboardMetrics() {
  const clinic = await getCurrentClinic();

  const [
    activePatients,
    activeMembershipPlans,
    activeSubscriptionsCount,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.patient.count({
      where: {
        clinicId: clinic.id,
        status: "ACTIVE",
      },
    }),
    prisma.membershipPlan.count({
      where: {
        clinicId: clinic.id,
        active: true,
      },
    }),
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        patient: {
          clinicId: clinic.id,
        },
      },
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        patient: {
          clinicId: clinic.id,
        },
      },
      select: {
        membershipPlan: {
          select: {
            monthlyPrice: true,
          },
        },
      },
    }),
  ]);

  const mockedMonthlyRevenue =
    activeSubscriptions.reduce(
      (total, subscription) =>
        total +
        (subscription.membershipPlan
          .monthlyPrice ?? 0),
      0
    );

  return {
    clinicName:
      clinic.brandName ?? clinic.name,
    activePatients,
    activeMembershipPlans,
    activeSubscriptionsCount,
    mockedMonthlyRevenue,
  };
}
