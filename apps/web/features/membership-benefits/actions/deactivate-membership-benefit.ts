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

export async function deactivateMembershipBenefit(
  id: string
) {
  await assertPermission(
    "benefits",
    "manage"
  );

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
        title: true,
      },
    });

  if (!benefit) {
    throw new Error(
      "Membership benefit not found."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.membershipBenefit.update({
        where: {
          id: benefit.id,
        },
        data: {
          active: false,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.DEACTIVATE,
        entity:
          AuditEntity.MEMBERSHIP_BENEFIT,
        entityId: benefit.id,
        entityLabel:
          benefit.title,
      });
    }
  );

  safeRevalidatePath("/dashboard");
  safeRevalidatePath(
    "/dashboard/plans"
  );
  safeRevalidatePath(
    "/dashboard/benefits"
  );
}
