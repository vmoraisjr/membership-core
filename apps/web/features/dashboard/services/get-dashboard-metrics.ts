import {
  AuditAction,
  ClinicStatus,
  ClinicSubscriptionStatus,
  ModuleStatus,
  PaymentStatus,
  SupportThreadStatus,
} from "@prisma/client";

import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { hasPermission } from "@/features/rbac/permissions";
import prisma from "@/lib/prisma";

import { getBenefitConsumptionMetrics } from "./get-benefit-consumption-metrics";
import { getActivePatients } from "./get-active-patients";
import { getActiveSubscriptions } from "./get-active-subscriptions";
import { getRecentActivity } from "./get-recent-activity";
import { getRevenueTrend } from "./get-revenue-trend";
import { getSubscriptionStatusBreakdown } from "./get-subscription-status-breakdown";
import { getUpcomingRenewals } from "./get-upcoming-renewals";

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

    const canViewActivity = hasPermission(
      currentUser.role,
      "auditLogs",
      "view"
    );

    const [
      activePatients,
      activeSubscriptionsCount,
      benefitConsumptionMetrics,
      overduePatientInvoices,
      monthlyPatientRevenue,
      activePlansCount,
      subscriptionStatusBreakdown,
      upcomingRenewals,
      revenueTrend,
      recentActivity,
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
      getSubscriptionStatusBreakdown(),
      getUpcomingRenewals(),
      getRevenueTrend(),
      canViewActivity
        ? getRecentActivity()
        : Promise.resolve([]),
    ]);

    return {
      scope: "clinic" as const,
      clinicName:
        clinic.brandName ??
        clinic.name,
      currentUserName: currentUser.name,
      activePatients,
      activeSubscriptionsCount,
      overduePatientInvoices,
      monthlyPatientRevenue:
        monthlyPatientRevenue._sum
          .amount ?? 0,
      subscriptionStatusBreakdown,
      upcomingRenewals,
      revenueTrend,
      recentActivity,
      canViewRecentActivity: canViewActivity,
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
      currentUserName: currentUser.name,
      platformMetrics: null,
    };
  }

  const [
    activeClinics,
    trialClinics,
    pastDueClinics,
    monthlySaasRevenue,
    moduleCounts,
    openSupportThreads,
    pendingInvites,
    criticalAuditEvents,
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
    prisma.supportThread.count({
      where: {
        status: {
          in: [
            SupportThreadStatus.OPEN,
            SupportThreadStatus.IN_PROGRESS,
            SupportThreadStatus.WAITING_PLATFORM,
          ],
        },
      },
    }),
    prisma.userInvite.count({
      where: {
        clinicId: null,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
    }),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(
            Date.now() -
              1000 * 60 * 60 * 24 * 7
          ),
        },
        action: {
          in: [
            AuditAction.DELETE,
            AuditAction.DEACTIVATE,
          ],
        },
      },
    }),
  ]);

  return {
    scope: "platform" as const,
    clinicName: null,
    currentUserName: currentUser.name,
    platformMetrics: {
      activeClinics,
      trialClinics,
      pastDueClinics,
      monthlySaasRevenue:
        monthlySaasRevenue._sum
          .amount ?? 0,
      openSupportThreads,
      pendingInvites,
      criticalAuditEvents,
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
