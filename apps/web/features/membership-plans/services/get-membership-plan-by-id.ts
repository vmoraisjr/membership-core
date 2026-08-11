import { AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinicContext } from "@/lib/auth/tenant";
import { filterByClinic } from "@/lib/auth/tenant";
import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from "@/features/audit-log/services/get-audit-logs";

export async function getMembershipPlanById(
  planId: string
) {
  const { clinicId } =
    await getCurrentClinicContext();

  const plan =
    await prisma.membershipPlan.findFirst({
      where: filterByClinic(clinicId, {
        id: planId,
      }),
      include: {
        benefits: {
          orderBy: {
            title: "asc",
          },
        },
        subscriptions: {
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            startedAt: "desc",
          },
        },
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  const activeSubscriptions =
    plan.subscriptions.filter(
      (subscription) =>
        MANAGEABLE_SUBSCRIPTION_STATUSES.some(
          (status) =>
            status === subscription.status
        )
    );

  const estimatedMonthlyRevenue =
    activeSubscriptions.length *
    (plan.monthlyPrice ?? 0);

  const auditLogs =
    await prisma.auditLog.findMany({
      where: {
        clinicId,
        entity:
          AuditEntity.MEMBERSHIP_PLAN,
        entityId: plan.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

  return {
    plan,
    activeSubscriptions,
    estimatedMonthlyRevenue,
    timeline: auditLogs.map((log) => ({
      id: log.id,
      occurredAt: log.createdAt,
      title: `${AUDIT_ACTION_LABELS[log.action] ?? log.action} ${AUDIT_ENTITY_LABELS[log.entity] ?? log.entity}`,
      actor: log.actor,
    })),
  };
}
