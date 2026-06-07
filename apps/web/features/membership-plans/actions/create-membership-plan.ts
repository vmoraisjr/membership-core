"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  membershipPlanSchema,
  type MembershipPlanSchema,
} from "../schemas/membership-plan.schema";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";


export async function createMembershipPlan(
  data: MembershipPlanSchema
) {
  await assertPermission(
    "plans",
    "manage"
  );

  const parsed =
    membershipPlanSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid form data.");
  }

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const plan =
        await tx.membershipPlan.create({
          data: {
            clinicId: clinic.id,

            name: parsed.data.name,

            description:
              parsed.data.description,

            monthlyPrice:
              parsed.data.monthlyPrice,

            active: true,
          },
          select: {
            id: true,
            name: true,
            monthlyPrice: true,
          },
        });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.CREATE,
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

  safeRevalidatePath(
    "/dashboard/plans"
  );
  safeRevalidatePath("/dashboard");
}
