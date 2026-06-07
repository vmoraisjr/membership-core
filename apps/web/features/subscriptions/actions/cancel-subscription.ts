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

export async function cancelSubscription(
  id: string
) {
  await assertPermission(
    "subscriptions",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const subscription =
    await prisma.subscription.findFirst({
      where: {
        id,
        patient: {
          clinicId: clinic.id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (!subscription) {
    throw new Error(
      "Subscription not found."
    );
  }

  if (
    subscription.status ===
    SubscriptionStatus.CANCELED
  ) {
    throw new Error(
      "Subscription is already canceled."
    );
  }

  const canceledAt = new Date();

  await prisma.$transaction(
    async (tx) => {
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },

        data: {
          // Subscriptions are canceled instead of deleted to preserve audit and billing history.
          status:
            SubscriptionStatus.CANCELED,
          canceledAt,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.CANCEL_SUBSCRIPTION,
        entity:
          AuditEntity.SUBSCRIPTION,
        entityId: subscription.id,
        entityLabel: subscription.id,
        metadata: {
          canceledAt:
            canceledAt.toISOString(),
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/subscriptions"
  );
}
