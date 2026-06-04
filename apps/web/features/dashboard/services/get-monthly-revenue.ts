import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getMonthlyRevenue() {
  const clinic = await getCurrentClinic();

  const activeSubscriptions =
    await prisma.subscription.findMany({
      where: {
        patient: {
          clinicId: clinic.id,
        },
        status: SubscriptionStatus.ACTIVE,
      },
      select: {
        membershipPlan: {
          select: {
            monthlyPrice: true,
            annualPrice: true,
          },
        },
      },
    });

  return activeSubscriptions.reduce(
    (totals, subscription) => {
      const monthlyPrice =
        subscription.membershipPlan
          .monthlyPrice ?? 0;
      const annualPrice =
        subscription.membershipPlan
          .annualPrice ??
        monthlyPrice * 12;

      return {
        monthlyRevenue:
          totals.monthlyRevenue +
          monthlyPrice,
        annualRevenue:
          totals.annualRevenue +
          annualPrice,
      };
    },
    {
      monthlyRevenue: 0,
      annualRevenue: 0,
    }
  );
}
