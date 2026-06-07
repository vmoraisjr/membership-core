import {
  ClinicStatus,
  ClinicSubscriptionStatus,
  ModuleStatus,
  PaymentStatus,
} from "@prisma/client";

import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import prisma from "@/lib/prisma";

import { getBenefitConsumptionMetrics } from "./get-benefit-consumption-metrics";
import { getActivePatients } from "./get-active-patients";
import { getActiveSubscriptions } from "./get-active-subscriptions";

export async function getDashboardMetrics() {
  const currentUser =
    await requireCurrentAppUser();
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  if (currentUser.clinicId) {
    const clinic =
      await prisma.clinic.findUnique({
        where: {
          id: currentUser.clinicId,
        },
      });

    if (!clinic) {
      throw new Error(
        "Current clinic not found."
      );
    }

    const [
      activePatients,
      activeSubscriptionsCount,
      benefitConsumptionMetrics,
      overduePatientInvoices,
      monthlyPatientRevenue,
      activePlansCount,
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
      prisma.membershipPlan.count({
        where: {
          clinicId: clinic.id,
          active: true,
        },
      }),
    ]);

    return {
      scope: "clinic" as const,
      clinicName:
        clinic.brandName ??
        clinic.name,
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
      activePlansCount,
      platformMetrics: null,
    };
  }

  const canViewPlatformMetrics =
    currentUser.role === "OWNER" ||
    currentUser.role === "ADMIN";

  if (!canViewPlatformMetrics) {
    return {
      scope: "platform" as const,
      clinicName: null,
      platformMetrics: null,
    };
  }

  const [
    activeClinics,
    trialClinics,
    pastDueClinics,
    monthlySaasRevenue,
    moduleCounts,
  ] = await Promise.all([
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
    prisma.module.findMany({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        key: true,
        name: true,
        isV1Active: true,
        _count: {
          select: {
            clinicModules: {
              where: {
                status:
                  ModuleStatus.ENABLED,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    scope: "platform" as const,
    clinicName: null,
    platformMetrics: {
      activeClinics,
      trialClinics,
      pastDueClinics,
      monthlySaasRevenue:
        monthlySaasRevenue._sum
          .amount ?? 0,
      activeModuleCounts:
        moduleCounts.map((module) => ({
          key: module.key,
          name: module.name,
          isV1Active:
            module.isV1Active,
          enabledClinicCount:
            module._count
              .clinicModules,
        })),
    },
  };
}
