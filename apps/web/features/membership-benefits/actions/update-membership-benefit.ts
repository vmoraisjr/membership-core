"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import {
  AuditAction,
  AuditEntity,
  BenefitType,
  ResetPeriod,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  membershipBenefitSchema,
  type MembershipBenefitSchema,
} from "../schemas/membership-benefit.schema";

export async function updateMembershipBenefit(
  id: string,
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

  const benefit =
    await prisma.membershipBenefit.findFirst({
      where: {
        id,
        membershipPlan: {
          clinicId: clinic.id,
        },
      },
      select: {
        id: true,
      },
    });

  if (!benefit) {
    throw new Error(
      "Membership benefit not found."
    );
  }

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
      const updatedBenefit =
        await tx.membershipBenefit.update({
          where: {
            id: benefit.id,
          },

          data: {
            membershipPlanId: plan.id,

            type: parsed.data.type,

            title:
              parsed.data.title,

            description:
              parsed.data.description,

            discountPercentage:
              parsed.data
                .discountPercentage,

            discountAmount:
              parsed.data.discountAmount,

            usageLimit:
              parsed.data.type ===
              BenefitType.LIMITED
                ? parsed.data.usageLimit ??
                  null
                : null,

            resetPeriod:
              parsed.data.type ===
              BenefitType.LIMITED
                ? ResetPeriod.MONTHLY
                : null,
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
        action: AuditAction.UPDATE,
        entity:
          AuditEntity.MEMBERSHIP_BENEFIT,
        entityId: updatedBenefit.id,
        entityLabel:
          updatedBenefit.title,
        metadata: {
          type: updatedBenefit.type,
        },
      });
    }
  );

  revalidatePath(
    "/dashboard/benefits"
  );
}
