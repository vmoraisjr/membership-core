"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import {
  AuditAction,
  AuditEntity,
  PatientKind,
  PatientStatus,
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
import { generatePatientContractForSubscription } from "@/features/contracts/services/contracts-foundation";

import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";
import { getEvaluatedSubscriptionStatus } from "../services/evaluate-subscription-status";

export async function createSubscription(
  data: SubscriptionSchema
) {
  await assertPermission(
    "subscriptions",
    "manage"
  );

  const parsed =
    subscriptionSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const [patient, plan] =
    await Promise.all([
      prisma.patient.findFirst({
        where: {
          id: parsed.data.patientId,
          clinicId: clinic.id,
          status: PatientStatus.ACTIVE,
          kind: PatientKind.TITULAR,
        },
        select: {
          id: true,
          fullName: true,
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
          name: true,
          monthlyPrice: true,
          annualPrice: true,
        },
      }),
    ]);

  if (!patient) {
    throw new Error(
      "Apenas titulares ativos podem receber assinaturas diretamente."
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

      const subscription =
        await tx.subscription.create({
          data: {
            patientId: patient.id,

            membershipPlanId: plan.id,

            startedAt: startDate,

            expiresAt: expiresDate,

            status,
          },
          select: {
            id: true,
          },
        });

      await createPatientInvoiceForSubscription(
        {
          clinicId: clinic.id,
          patientId: patient.id,
          subscriptionId:
            subscription.id,
          plan,
        },
        tx,
        {
          actor: actor.displayName,
          actorUserId: actor.id,
        }
      );
      await generatePatientContractForSubscription(
        {
          clinicId: clinic.id,
          patientId: patient.id,
          subscriptionId:
            subscription.id,
        },
        tx
      );

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.CREATE,
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

  safeRevalidatePath(
    "/dashboard/subscriptions"
  );
  safeRevalidatePath(
    "/dashboard/billing"
  );
  safeRevalidatePath(
    "/dashboard/contracts"
  );
  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/dashboard/clientes");
  safeRevalidatePath("/dashboard/planos");
  safeRevalidatePath("/dashboard/cobrancas");
}
