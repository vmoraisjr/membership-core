"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import {
  AuditAction,
  AuditEntity,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";

export async function deactivateMembershipPlan(
  id: string,
  confirmationName: string
) {
  await assertPermission(
    "plans",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const plan =
    await prisma.membershipPlan.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  if (plan.name !== confirmationName) {
    throw new Error(
      "Type the plan name exactly to confirm cancellation."
    );
  }

  if (!plan.active) {
    throw new Error(
      "Membership plan is already inactive."
    );
  }

  const canceledAt = new Date();

  await prisma.$transaction(
    async (tx) => {
      const deactivatedBenefits =
        await tx.membershipBenefit.updateMany({
          where: {
            membershipPlanId: plan.id,
          },
          data: {
            active: false,
          },
        });
      const canceledSubscriptions =
        await tx.subscription.updateMany({
          where: {
            membershipPlanId: plan.id,
            status: {
              in: [
                ...MANAGEABLE_SUBSCRIPTION_STATUSES,
              ],
            },
          },
          data: {
            status:
              SubscriptionStatus.CANCELED,
            canceledAt,
          },
        });

      await tx.membershipPlan.update({
        where: {
          id: plan.id,
        },
        data: {
          active: false,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.DEACTIVATE,
        entity:
          AuditEntity.MEMBERSHIP_PLAN,
        entityId: plan.id,
        entityLabel: plan.name,
        metadata: {
          deactivatedBenefits:
            deactivatedBenefits.count,
          canceledSubscriptions:
            canceledSubscriptions.count,
        },
      });
    }
  );

  safeRevalidatePath("/dashboard");
  safeRevalidatePath(
    "/dashboard/plans"
  );
  safeRevalidatePath(
    "/dashboard/benefits"
  );
  safeRevalidatePath(
    "/dashboard/patients"
  );
  safeRevalidatePath(
    "/dashboard/subscriptions"
  );
}
