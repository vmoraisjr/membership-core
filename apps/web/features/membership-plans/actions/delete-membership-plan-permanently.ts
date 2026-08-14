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

export async function deleteMembershipPlanPermanently(
  id: string
) {
  await assertPermission(
    "plans",
    "deletePermanent"
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
        _count: {
          select: {
            benefits: true,
            subscriptions: true,
          },
        },
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  if (plan.active) {
    throw new Error(
      "Only inactive membership plans can be permanently deleted."
    );
  }

  if (
    plan._count.subscriptions > 0
  ) {
    throw new Error(
      "This plan has subscription history and cannot be permanently deleted."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.membershipBenefit.deleteMany({
        where: {
          membershipPlanId: plan.id,
        },
      });
      await tx.membershipPlan.delete({
        where: {
          id: plan.id,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.DELETE,
        entity:
          AuditEntity.MEMBERSHIP_PLAN,
        entityId: plan.id,
        entityLabel: plan.name,
        metadata: {
          deletedBenefits:
            plan._count.benefits,
        },
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/planos");
  revalidatePath("/dashboard/clientes");
}
