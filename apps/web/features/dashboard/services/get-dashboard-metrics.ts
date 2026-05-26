<<<<<<< HEAD
import { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getDashboardMetrics() {
  const clinic = await getCurrentClinic();

  const [
    totalPatients,
    totalMembershipPlans,
    totalSubscriptions,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.patient.count({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.membershipPlan.count({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.subscription.count({
      where: {
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
    totalPatients,
    totalMembershipPlans,
    totalSubscriptions,
    mockedMonthlyRevenue,
  };
}
=======
import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics() {
  const [
    totalPatients,
    totalPlans,
    totalSubscriptions,
  ] = await Promise.all([
    prisma.patient.count(),

    prisma.membershipPlan.count(),

    prisma.subscription.count(),
  ]);

  return {
    totalPatients,

    totalPlans,

    totalSubscriptions,

    monthlyRevenue: 12450,
  };
}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
