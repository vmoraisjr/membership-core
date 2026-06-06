import {
  ClinicStatus,
  ClinicSubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import prisma from "@/lib/prisma";

import { getBenefitConsumptionMetrics } from "./get-benefit-consumption-metrics";
import { getActivePatients } from "./get-active-patients";
import { getActiveSubscriptions } from "./get-active-subscriptions";

export async function getDashboardMetrics() {
  const clinic = await getCurrentClinic();
  const currentUser =
    await requireCurrentAppUser();
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const [
    activePatients,
    activeSubscriptionsCount,
    benefitConsumptionMetrics,
    overduePatientInvoices,
    monthlyPatientRevenue,
    platformMetrics,
  ] = await Promise.all([
    getActivePatients(),
    getActiveSubscriptions(),
    getBenefitConsumptionMetrics(),
    prisma.patientInvoice.count({
      where: {
        clinicId: clinic.id,
        status: PaymentStatus.OVERDUE,
      },
    }),
    prisma.patientInvoice.aggregate({
      where: {
        clinicId: clinic.id,
        status: PaymentStatus.PAID,
        paidAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    currentUser.clinicId == null &&
    (currentUser.role === "OWNER" ||
      currentUser.role === "ADMIN")
      ? Promise.all([
          prisma.clinic.count({
            where: {
              status: ClinicStatus.ACTIVE,
            },
          }),
          prisma.clinicSubscription.count({
            where: {
              status:
                ClinicSubscriptionStatus.TRIAL,
            },
          }),
          prisma.clinicSubscription.count({
            where: {
              status:
                ClinicSubscriptionStatus.PAST_DUE,
            },
          }),
          prisma.clinicInvoice.aggregate({
            where: {
              status: PaymentStatus.PAID,
              paidAt: {
                gte: startOfMonth,
              },
            },
            _sum: {
              amount: true,
            },
          }),
        ]).then(
          ([
            activeClinics,
            trialClinics,
            pastDueClinics,
            monthlySaasRevenue,
          ]) => ({
            activeClinics,
            trialClinics,
            pastDueClinics,
            monthlySaasRevenue:
              monthlySaasRevenue
                ._sum.amount ?? 0,
          })
        )
      : Promise.resolve(null),
  ]);

  return {
    clinicName:
      clinic.brandName ?? clinic.name,
    activePatients,
    activeSubscriptionsCount,
    overduePatientInvoices,
    monthlyPatientRevenue:
      monthlyPatientRevenue._sum
        .amount ?? 0,
    benefitsConsumed:
      benefitConsumptionMetrics.consumedThisMonth,
    benefitUsageEvents:
      benefitConsumptionMetrics.totalUsageEvents,
    platformMetrics,
  };
}
