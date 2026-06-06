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

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";

export async function updatePatient(
  id: string,
  data: PatientSchema
) {
  await assertPermission(
    "patients",
    "manage"
  );

  const parsed =
    patientSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const existingPatient =
        await tx.patient.findFirst({
          where: {
            id,
            clinicId: clinic.id,
          },
          select: {
            id: true,
          },
        });

      if (!existingPatient) {
        throw new Error(
          "Patient not found."
        );
      }

      const patient =
        await tx.patient.update({
          where: {
            id: existingPatient.id,
          },
          data: {
            fullName:
              parsed.data.fullName,
            email:
              parsed.data.email,
            phone:
              parsed.data.phone,
            birthDate: new Date(
              parsed.data.birthDate
            ),
            document:
              parsed.data.document,
            zipCode:
              parsed.data.zipCode,
            city:
              parsed.data.city,
            state:
              parsed.data.state,
            address:
              parsed.data.address,
          },
          select: {
            id: true,
            clinicId: true,
            fullName: true,
          },
        });

      await createAuditLog(tx, {
        clinicId: patient.clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.PATIENT,
        entityId: patient.id,
        entityLabel:
          patient.fullName,
      });
    }
  );

  revalidatePath(
    "/dashboard/patients"
  );
}
