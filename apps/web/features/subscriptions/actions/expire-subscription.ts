"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import {
  AuditAction,
  AuditEntity,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

export async function expireSubscription(
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
      SubscriptionStatus.CANCELED ||
    subscription.status ===
      SubscriptionStatus.EXPIRED
  ) {
    throw new Error(
      "Only active lifecycle subscriptions can be expired."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status:
            SubscriptionStatus.EXPIRED,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.EXPIRE_SUBSCRIPTION,
        entity:
          AuditEntity.SUBSCRIPTION,
        entityId: subscription.id,
        entityLabel: subscription.id,
      });
    }
  );

  revalidatePath(
    "/dashboard/subscriptions"
  );
}
