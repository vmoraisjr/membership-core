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

export async function cloneMembershipPlan(
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
      include: {
        benefits: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

  if (!plan) {
    throw new Error(
      "Membership plan not found."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const clonedPlan =
        await tx.membershipPlan.create({
          data: {
            clinicId: clinic.id,
            name: `${plan.name} (cópia)`,
            description:
              plan.description,
            monthlyPrice:
              plan.monthlyPrice,
            annualPrice:
              plan.annualPrice,
            active: true,
          },
        });

      if (plan.benefits.length > 0) {
        await tx.membershipBenefit.createMany({
          data: plan.benefits.map(
            (benefit) => ({
              membershipPlanId:
                clonedPlan.id,
              type: benefit.type,
              title: benefit.title,
              description:
                benefit.description,
              active: true,
              discountPercentage:
                benefit.discountPercentage,
              discountAmount:
                benefit.discountAmount,
              usageLimit:
                benefit.usageLimit,
              resetPeriod:
                benefit.resetPeriod,
            })
          ),
        });
      }

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.CREATE,
        entity:
          AuditEntity.MEMBERSHIP_PLAN,
        entityId: clonedPlan.id,
        entityLabel: clonedPlan.name,
        metadata: {
          sourcePlanId: plan.id,
          clonedBenefits:
            plan.benefits.length,
        },
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/benefits");
}
