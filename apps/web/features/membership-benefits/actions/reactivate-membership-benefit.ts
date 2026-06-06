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

export async function reactivateMembershipBenefit(
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
        active: true,
        membershipPlan: {
          select: {
            active: true,
          },
        },
      },
    });

  if (!benefit) {
    throw new Error(
      "Membership benefit not found."
    );
  }

  if (benefit.active) {
    throw new Error(
      "Membership benefit is already active."
    );
  }

  if (
    !benefit.membershipPlan.active
  ) {
    throw new Error(
      "Reactivate the membership plan before reactivating this benefit."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.membershipBenefit.update({
        where: {
          id: benefit.id,
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
          AuditEntity.MEMBERSHIP_BENEFIT,
        entityId: benefit.id,
        entityLabel:
          benefit.title,
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
}
