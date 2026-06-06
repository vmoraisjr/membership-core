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

import { getEvaluatedSubscriptionStatus } from "../services/evaluate-subscription-status";

export async function resumeSubscription(
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
        startedAt: true,
        expiresAt: true,
      },
    });

  if (!subscription) {
    throw new Error(
      "Subscription not found."
    );
  }

  if (
    subscription.status !==
    SubscriptionStatus.PAUSED
  ) {
    throw new Error(
      "Only paused subscriptions can be resumed."
    );
  }

  const nextStatus =
    getEvaluatedSubscriptionStatus({
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      status: SubscriptionStatus.ACTIVE,
    });

  await prisma.$transaction(
    async (tx) => {
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: nextStatus,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.RESUME_SUBSCRIPTION,
        entity:
          AuditEntity.SUBSCRIPTION,
        entityId: subscription.id,
        entityLabel: subscription.id,
        metadata: {
          status: nextStatus,
        },
      });
    }
  );

  revalidatePath(
    "/dashboard/subscriptions"
  );
}
