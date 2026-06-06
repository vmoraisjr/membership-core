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

export async function reactivateMembershipPlan(
  id: string
) {
  await assertPermission(
    "plans",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const plan =
    await prisma.membershipPlan.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  if (plan.active) {
    throw new Error(
      "Membership plan is already active."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.membershipPlan.update({
        where: {
          id: plan.id,
        },
        data: {
          active: true,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.REACTIVATE,
        entity:
          AuditEntity.MEMBERSHIP_PLAN,
        entityId: plan.id,
        entityLabel: plan.name,
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
  revalidatePath("/dashboard/subscriptions");
}
