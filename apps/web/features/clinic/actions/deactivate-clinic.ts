"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { ClinicStatus } from "@prisma/client";
import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { assertClinicAccess } from "@/lib/auth/assert-clinic-access";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

export async function deactivateClinic(
  id: string
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const clinic =
    await prisma.clinic.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
  const actor =
    await getCurrentAuditActor();

  if (!clinic) {
    throw new Error("Clinic not found.");
  }

  await assertClinicAccess({
    clinicId: clinic.id,
  });

  if (
    clinic.status ===
    ClinicStatus.INACTIVE
  ) {
    throw new Error(
      "Clinic is already inactive."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.clinic.update({
        where: {
          id: clinic.id,
        },
        data: {
          status:
            ClinicStatus.INACTIVE,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.DEACTIVATE,
        entity: AuditEntity.CLINIC,
        entityId: clinic.id,
        entityLabel: clinic.name,
      });
    }
  );

  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/dashboard/clinics");
  safeRevalidatePath("/dashboard/empresas");
  safeRevalidatePath(
    `/dashboard/empresas/${id}`
  );
}
