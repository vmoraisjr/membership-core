"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  benefitUsageSchema,
  type BenefitUsageSchema,
} from "../schemas/benefit-usage.schema";
import { validateBenefitUsage } from "../services/validate-benefit-usage";

export async function consumeBenefit(
  data: BenefitUsageSchema
) {
  await assertPermission(
    "benefitUsage",
    "manage"
  );

  const parsed =
    benefitUsageSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      "Invalid benefit usage data."
    );
  }

  const validated =
    await validateBenefitUsage({
      subscriptionId:
        parsed.data.subscriptionId,
      membershipBenefitId:
        parsed.data
          .membershipBenefitId,
      quantity: parsed.data.quantity,
    });
  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const usage =
        await tx.benefitUsage.create({
          data: {
            subscriptionId:
              validated.subscription.id,
            membershipBenefitId:
              validated.benefit.id,
            quantity:
              parsed.data.quantity,
            usedBy: parsed.data.usedBy,
            notes: parsed.data.notes,
          },
          select: {
            id: true,
            subscription: {
              select: {
                patient: {
                  select: {
                    clinicId: true,
                  },
                },
              },
            },
          },
        });

      await createAuditLog(tx, {
        clinicId:
          usage.subscription.patient
            .clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.CONSUME_BENEFIT,
        entity:
          AuditEntity.BENEFIT_USAGE,
        entityId: usage.id,
        entityLabel:
          validated.benefit.title,
        metadata: {
          subscriptionId:
            validated.subscription.id,
          membershipBenefitId:
            validated.benefit.id,
          quantity:
            parsed.data.quantity,
          usedBy: parsed.data.usedBy,
        },
      });
    }
  );

  revalidatePath("/dashboard/benefit-usage");
  revalidatePath("/dashboard/subscriptions");
}
