"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import {
  AuditAction,
  AuditEntity,
  PatientKind,
  PatientStatus,
} from "@prisma/client";

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
import {
  findResponsiblePatientByDocument,
  isMinorPatient,
  normalizeDigits,
} from "../services/patient-family";

export async function updatePatient(
  id: string,
  data: PatientSchema
) {
  await assertPermission(
    "patients",
    "manage"
  );

  const clinic =
    await getCurrentClinic();

  const existingPatient =
    await prisma.patient.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        fullName: true,
        kind: true,
        status: true,
      },
    });

  if (!existingPatient) {
    throw new Error(
      "Patient not found."
    );
  }

  const parsed =
    patientSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

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

  await prisma.$transaction(
    async (tx) => {
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
            birthDate,
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
            kind: parsed.data.kind,
            responsiblePatientId:
              responsiblePatient?.id ??
              null,
            status:
              parsed.data.kind ===
                PatientKind.TITULAR &&
              isMinorPatient(
                birthDate
              )
                ? PatientStatus.INACTIVE
                : existingPatient.status,
            inactiveReason:
              parsed.data.kind ===
                PatientKind.TITULAR &&
              isMinorPatient(
                birthDate
              )
                ? "Paciente menor de idade sem titular responsável ativo."
                : null,
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
        metadata: {
          previousKind:
            existingPatient.kind,
          nextKind:
            parsed.data.kind,
          responsiblePatientId:
            responsiblePatient?.id ??
            null,
          targetStatus:
            parsed.data.kind ===
              PatientKind.TITULAR &&
            isMinorPatient(
              birthDate
            )
              ? PatientStatus.INACTIVE
              : existingPatient.status,
        },
      });
    }
  );

  revalidatePath(
    "/dashboard/patients"
  );
  revalidatePath(
    "/dashboard/subscriptions"
  );
}
