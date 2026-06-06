"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import {
  AuditAction,
  AuditEntity,
  PatientStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";
import { getEvaluatedSubscriptionStatus } from "../services/evaluate-subscription-status";

export async function updateSubscription(
  id: string,
  data: SubscriptionSchema
) {
  await assertPermission(
    "subscriptions",
    "manage"
  );

  const parsed =
    subscriptionSchema.safeParse(
      data
    );

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const [subscription, patient, plan] =
    await Promise.all([
      prisma.subscription.findFirst({
        where: {
          id,
          patient: {
            clinicId: clinic.id,
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.patient.findFirst({
        where: {
          id: parsed.data.patientId,
          clinicId: clinic.id,
          status: PatientStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      }),
      prisma.membershipPlan.findFirst({
        where: {
          id: parsed.data.membershipPlanId,
          clinicId: clinic.id,
          active: true,
        },
        select: {
          id: true,
        },
      }),
    ]);

  if (!subscription) {
    throw new Error(
      "Subscription not found."
    );
  }

  if (!patient) {
    throw new Error(
      "Only active patients can receive subscriptions."
    );
  }

  if (!plan) {
    throw new Error(
      "Only active plans can receive subscriptions."
    );
  }

  const startDate = new Date(
    parsed.data.startedAt
  );
  const expiresDate =
    parsed.data.expiresAt
      ? new Date(parsed.data.expiresAt)
      : new Date(
          startDate.getTime() +
            30 * 24 * 60 * 60 * 1000
        );

  await prisma.$transaction(
    async (tx) => {
      const status =
        getEvaluatedSubscriptionStatus({
          startedAt: startDate,
          expiresAt: expiresDate,
          status:
            SubscriptionStatus.ACTIVE,
        });

      await tx.subscription.update({
        where: {
          id: subscription.id,
        },

        data: {
          patientId: patient.id,

          membershipPlanId: plan.id,

          startedAt: startDate,

          expiresAt: expiresDate,
          status,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity:
          AuditEntity.SUBSCRIPTION,
        entityId: subscription.id,
        entityLabel: subscription.id,
        metadata: {
          patientId: patient.id,
          membershipPlanId: plan.id,
          status,
        },
      });
    }
  );

  revalidatePath(
    "/dashboard/subscriptions"
  );
}
