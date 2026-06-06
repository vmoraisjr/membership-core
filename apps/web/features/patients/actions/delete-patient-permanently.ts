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

export async function deletePatientPermanently(
  id: string
) {
  await assertPermission(
    "patients",
    "deletePermanent"
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
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

  if (!patient) {
    throw new Error(
      "Patient not found."
    );
  }

  if (
    patient.status !==
    PatientStatus.INACTIVE
  ) {
    throw new Error(
      "Only inactive patients can be permanently deleted."
    );
  }

  if (
    patient._count
      .subscriptions > 0
  ) {
    throw new Error(
      "This patient has subscription history and cannot be permanently deleted."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.patient.delete({
        where: {
          id: patient.id,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.DELETE,
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
