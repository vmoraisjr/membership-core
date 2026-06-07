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
import { createPatientInvoiceForSubscription } from "@/features/billing/services/billing-foundation";

import { getEvaluatedSubscriptionStatus } from "../services/evaluate-subscription-status";

type RenewSubscriptionInput = {
  days?: number;
};

export async function renewSubscription(
  id: string,
  input: RenewSubscriptionInput = {}
) {
  await assertPermission(
    "subscriptions",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();
  const days = input.days ?? 30;

  if (days <= 0) {
    throw new Error(
      "Renewal days must be greater than zero."
    );
  }

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
        patientId: true,
        membershipPlan: {
          select: {
            id: true,
            name: true,
            active: true,
            monthlyPrice: true,
            annualPrice: true,
          },
        },
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
      "Canceled subscriptions cannot be renewed."
    );
  }

  if (!subscription.membershipPlan.active) {
    throw new Error(
      "Inactive plans cannot be renewed into new billing cycles."
    );
  }

  const referenceDate =
    subscription.expiresAt &&
    subscription.expiresAt.getTime() >
      Date.now()
      ? subscription.expiresAt
      : new Date();

  const renewedExpirationDate =
    new Date(referenceDate);

  renewedExpirationDate.setDate(
    renewedExpirationDate.getDate() +
      days
  );

  await prisma.$transaction(
    async (tx) => {
      const status =
        getEvaluatedSubscriptionStatus({
          startedAt:
            subscription.startedAt,
          expiresAt:
            renewedExpirationDate,
          status:
            SubscriptionStatus.ACTIVE,
        });

      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          expiresAt:
            renewedExpirationDate,
          status,
          canceledAt: null,
        },
      });

      await createPatientInvoiceForSubscription(
        {
          clinicId: clinic.id,
          patientId:
            subscription.patientId,
          subscriptionId:
            subscription.id,
          plan:
            subscription.membershipPlan,
          dueDate:
            renewedExpirationDate,
          description:
            `${subscription.membershipPlan.name} renewal invoice`,
        },
        tx,
        {
          actor: actor.displayName,
          actorUserId: actor.id,
        }
      );

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.RENEW_SUBSCRIPTION,
        entity:
          AuditEntity.SUBSCRIPTION,
        entityId: subscription.id,
        entityLabel: subscription.id,
        metadata: {
          days,
          status,
          expiresAt:
            renewedExpirationDate.toISOString(),
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/subscriptions"
  );
  safeRevalidatePath(
    "/dashboard/billing"
  );
  safeRevalidatePath("/dashboard");
}
