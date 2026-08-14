"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { PatientStatus } from "@prisma/client";
import {
  AuditAction,
  AuditEntity,
  PatientKind,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";
import {
  findResponsiblePatientByDocument,
  isMinorPatient,
  normalizeDigits,
} from "../services/patient-family";

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
  const birthDate = new Date(
    parsed.data.birthDate
  );
  const responsiblePatient =
    parsed.data.kind ===
    PatientKind.DEPENDENT
      ? await findResponsiblePatientByDocument(
          clinic.id,
          parsed.data
            .responsibleDocument ?? ""
        )
      : null;

  if (
    parsed.data.kind ===
      PatientKind.DEPENDENT &&
    !responsiblePatient
  ) {
    throw new Error(
      "O responsável informado precisa estar cadastrado como titular ativo da clínica."
    );
  }

  if (
    responsiblePatient &&
    normalizeDigits(
      responsiblePatient.document
    ) ===
      normalizeDigits(
        parsed.data.document
      )
  ) {
    throw new Error(
      "O paciente dependente não pode usar o mesmo documento do responsável."
    );
  }

  if (
    isMinorPatient(birthDate) &&
    parsed.data.kind !==
      PatientKind.DEPENDENT
  ) {
    throw new Error(
      "Paciente menor de idade deve ser cadastrado com um responsável titular."
    );
  }

  const createdPatient = await prisma.$transaction(
    async (tx) => {
      const patient =
        await tx.patient.create({
          data: {
            clinicId: clinic.id,
            fullName:
              parsed.data.fullName,
            email: parsed.data.email,
            phone: parsed.data.phone,
            birthDate,
            document:
              parsed.data.document,
            zipCode:
              parsed.data.zipCode,
            city: parsed.data.city,
            state: parsed.data.state,
            address:
              parsed.data.address,
            kind: parsed.data.kind,
            responsiblePatientId:
              responsiblePatient?.id ??
              null,
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
        metadata: {
          kind: parsed.data.kind,
          responsiblePatientId:
            responsiblePatient?.id ??
            null,
        },
      });

      return patient;
    }
  );

  safeRevalidatePath(
    "/dashboard/patients"
  );
  safeRevalidatePath("/dashboard/clientes");
  safeRevalidatePath("/dashboard");

  return {
    id: createdPatient.id,
    fullName: createdPatient.fullName,
    kind: parsed.data.kind,
  };
}
