"use server";

import {
  AuditAction,
  AuditEntity,
  AppUserRole,
  BenefitUsageStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { assertPermission } from "@/features/rbac/services/assert-permission";

export async function cancelBenefitUsageAction(
  formData: FormData
) {
  await assertPermission(
    "benefitUsage",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();

  if (
    currentUser.role !==
      AppUserRole.OWNER &&
    currentUser.role !==
      AppUserRole.ADMIN
  ) {
    throw new Error(
      "Only owners or admins can cancel benefit usage."
    );
  }

  const usageId = String(
    formData.get("usageId") ?? ""
  );
  const reason = String(
    formData.get("reason") ?? ""
  ).trim();

  if (!reason) {
    throw new Error(
      "A cancellation reason is required."
    );
  }

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const usage =
    await prisma.benefitUsage.findFirst({
      where: {
        id: usageId,
        subscription: {
          patient: {
            clinicId: clinic.id,
          },
        },
      },
      select: {
        id: true,
        status: true,
        quantity: true,
        notes: true,
        subscriptionId: true,
        membershipBenefitId: true,
        membershipBenefit: {
          select: {
            title: true,
          },
        },
      },
    });

  if (!usage) {
    throw new Error(
      "Benefit usage not found."
    );
  }

  if (
    usage.status ===
    BenefitUsageStatus.CANCELED
  ) {
    return;
  }

  const cancellationNote = `Cancelado por ${actor.displayName}: ${reason}`;
  const nextNotes = usage.notes
    ? `${usage.notes}\n\n${cancellationNote}`
    : cancellationNote;

  await prisma.$transaction(
    async (tx) => {
      await tx.benefitUsage.update({
        where: {
          id: usage.id,
        },
        data: {
          status:
            BenefitUsageStatus.CANCELED,
          canceledAt: new Date(),
          notes: nextNotes,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.DEACTIVATE,
        entity:
          AuditEntity.BENEFIT_USAGE,
        entityId: usage.id,
        entityLabel:
          usage.membershipBenefit.title,
        metadata: {
          previousStatus:
            usage.status,
          nextStatus:
            BenefitUsageStatus.CANCELED,
          quantity: usage.quantity,
          subscriptionId:
            usage.subscriptionId,
          membershipBenefitId:
            usage.membershipBenefitId,
          reason,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/benefit-usage"
  );
  safeRevalidatePath(
    "/dashboard/patients"
  );
}
