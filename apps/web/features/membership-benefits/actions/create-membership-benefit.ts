"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  membershipBenefitSchema,
  type MembershipBenefitSchema,
} from "../schemas/membership-benefit.schema";

export async function createMembershipBenefit(
  data: MembershipBenefitSchema
) {
  await assertPermission(
    "benefits",
    "manage"
  );

  const parsed =
    membershipBenefitSchema.safeParse(
      data
    );

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const plan =
    await prisma.membershipPlan.findFirst({
      where: {
        id: parsed.data.membershipPlanId,
        clinicId: clinic.id,
        active: true,
      },
      select: {
        id: true,
      },
    });

  if (!plan) {
    throw new Error(
      "Only active clinic plans can receive benefits."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const benefit =
        await tx.membershipBenefit.create({
          data: {
            membershipPlanId: plan.id,

            type: parsed.data.type,

            title:
              parsed.data.title,

            description:
              parsed.data.description,

            active: true,

            discountPercentage:
              parsed.data
                .discountPercentage,

            discountAmount:
              parsed.data.discountAmount,

            usageLimit:
              parsed.data.usageLimit,

            resetPeriod:
              parsed.data.resetPeriod ||
              null,
          },
          select: {
            id: true,
            title: true,
            type: true,
          },
        });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.CREATE,
        entity:
          AuditEntity.MEMBERSHIP_BENEFIT,
        entityId: benefit.id,
        entityLabel: benefit.title,
        metadata: {
          type: benefit.type,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/benefits"
  );
}
