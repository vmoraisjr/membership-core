"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { PatientStatus } from "@prisma/client";
import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";

export async function createPatient(
  data: PatientSchema
) {
  await assertPermission(
    "patients",
    "manage"
  );

  const parsed =
    patientSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid form data.");
  }

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const patient =
        await tx.patient.create({
          data: {
            clinicId: clinic.id,
            fullName:
              parsed.data.fullName,
            email: parsed.data.email,
            phone: parsed.data.phone,
            birthDate: new Date(
              parsed.data.birthDate
            ),
            document:
              parsed.data.document,
            zipCode:
              parsed.data.zipCode,
            city: parsed.data.city,
            state: parsed.data.state,
            address:
              parsed.data.address,
            status:
              PatientStatus.ACTIVE,
          },
          select: {
            id: true,
            fullName: true,
          },
        });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.CREATE,
        entity: AuditEntity.PATIENT,
        entityId: patient.id,
        entityLabel:
          patient.fullName,
      });
    }
  );

  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard");
}
