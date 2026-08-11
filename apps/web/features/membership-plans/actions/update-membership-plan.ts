"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  membershipPlanSchema,
  type MembershipPlanSchema,
} from "../schemas/membership-plan.schema";

export async function updateMembershipPlan(
  id: string,
  data: MembershipPlanSchema
) {
  await assertPermission(
    "plans",
    "manage"
  );

  const parsed =
    membershipPlanSchema.safeParse(
      data
    );

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const existingPlan =
        await tx.membershipPlan.findFirst({
          where: {
            id,
            clinicId: clinic.id,
          },
          select: {
            id: true,
          },
        });

      if (!existingPlan) {
        throw new Error(
          "Membership plan not found."
        );
      }

      const plan =
        await tx.membershipPlan.update({
          where: {
            id: existingPlan.id,
          },
          data: {
            name: parsed.data.name,
            description:
              parsed.data.description,
            monthlyPrice:
              parsed.data.monthlyPrice,
            annualPrice:
              parsed.data.annualPrice ??
              null,
          },
          select: {
            id: true,
            clinicId: true,
            name: true,
            monthlyPrice: true,
          },
        });

      await createAuditLog(tx, {
        clinicId: plan.clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity:
          AuditEntity.MEMBERSHIP_PLAN,
        entityId: plan.id,
        entityLabel: plan.name,
        metadata: {
          monthlyPrice:
            plan.monthlyPrice,
        },
      });
    }
  );

  revalidatePath("/dashboard/plans");
}
