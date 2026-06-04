import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import { getBenefitConsumptionMetrics } from "./get-benefit-consumption-metrics";
import { getActivePatients } from "./get-active-patients";
import { getActiveSubscriptions } from "./get-active-subscriptions";
import { getMonthlyRevenue } from "./get-monthly-revenue";
import { getExpiringSubscriptions } from "../../subscriptions/services/get-expiring-subscriptions";

export async function getDashboardMetrics() {
  const clinic = await getCurrentClinic();

  const [
    activePatients,
    activeMembershipPlans,
    activeSubscriptionsCount,
    revenueMetrics,
    benefitConsumptionMetrics,
    expiringSubscriptions,
  ] = await Promise.all([
    getActivePatients(),
    prisma.membershipPlan.count({
      where: {
        clinicId: clinic.id,
        active: true,
      },
    }),
    getActiveSubscriptions(),
    getMonthlyRevenue(),
    getBenefitConsumptionMetrics(),
    getExpiringSubscriptions(),
  ]);

  return {
    clinicName:
      clinic.brandName ?? clinic.name,
    activePatients,
    activeMembershipPlans,
    activeSubscriptionsCount,
    monthlyRevenue:
      revenueMetrics.monthlyRevenue,
    annualRevenue:
      revenueMetrics.annualRevenue,
    benefitsConsumed:
      benefitConsumptionMetrics.consumedThisMonth,
    benefitUsageEvents:
      benefitConsumptionMetrics.totalUsageEvents,
    expiringSubscriptionsCount:
      expiringSubscriptions.length,
  };
}
