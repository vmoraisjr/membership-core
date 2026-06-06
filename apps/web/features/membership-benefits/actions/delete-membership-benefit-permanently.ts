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

export async function deleteMembershipBenefitPermanently(
  id: string
) {
  await assertPermission(
    "benefits",
    "deletePermanent"
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
        _count: {
          select: {
            usages: true,
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
      "Only inactive benefits can be permanently deleted."
    );
  }

  if (
    benefit._count.usages > 0
  ) {
    throw new Error(
      "This benefit has usage history and cannot be permanently deleted."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.membershipBenefit.delete({
        where: {
          id: benefit.id,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.DELETE,
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
