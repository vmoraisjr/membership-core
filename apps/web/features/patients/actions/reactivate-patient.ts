"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import {
  AuditAction,
  AuditEntity,
  PatientStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

export async function reactivatePatient(
  id: string
) {
  await assertPermission(
    "patients",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const patient =
    await prisma.patient.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        fullName: true,
        status: true,
      },
    });

  if (!patient) {
    throw new Error(
      "Patient not found."
    );
  }

  if (
    patient.status ===
    PatientStatus.ACTIVE
  ) {
    throw new Error(
      "Patient is already active."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.patient.update({
        where: {
          id: patient.id,
        },
        data: {
          status:
            PatientStatus.ACTIVE,
          inactiveReason: null,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.REACTIVATE,
        entity: AuditEntity.PATIENT,
        entityId: patient.id,
        entityLabel:
          patient.fullName,
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/subscriptions");
}
