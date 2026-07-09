"use server";

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
import { assertPermission } from "@/features/rbac/services/assert-permission";

import { isMinorPatient } from "../services/patient-family";

export async function removePatientDependency(
  patientId: string,
  nextStatus: PatientStatus
) {
  await assertPermission(
    "patients",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const patient =
        await tx.patient.findFirst({
          where: {
            id: patientId,
            clinicId: clinic.id,
          },
          select: {
            id: true,
            clinicId: true,
            fullName: true,
            kind: true,
            birthDate: true,
            responsiblePatientId: true,
            status: true,
          },
        });

      if (!patient) {
        throw new Error(
          "Patient not found."
        );
      }

      if (
        patient.kind !==
        PatientKind.DEPENDENT
      ) {
        throw new Error(
          "Apenas pacientes dependentes podem remover o vínculo familiar."
        );
      }

      if (
        nextStatus ===
          PatientStatus.ACTIVE &&
        isMinorPatient(
          patient.birthDate
        )
      ) {
        throw new Error(
          "Paciente menor de idade não pode ficar ativo como titular sem um responsável."
        );
      }

      const updatedPatient =
        await tx.patient.update({
          where: {
            id: patient.id,
          },
          data: {
            kind: PatientKind.TITULAR,
            responsiblePatientId: null,
            status: nextStatus,
            inactiveReason:
              nextStatus ===
              PatientStatus.INACTIVE
                ? "Dependência removida. Paciente aguarda novo titular responsável para reativação."
                : null,
          },
          select: {
            id: true,
            clinicId: true,
            fullName: true,
            kind: true,
            status: true,
          },
        });

      await createAuditLog(tx, {
        clinicId:
          updatedPatient.clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.PATIENT,
        entityId: updatedPatient.id,
        entityLabel:
          updatedPatient.fullName,
        metadata: {
          operation:
            "remove-dependency",
          previousKind: patient.kind,
          nextKind:
            updatedPatient.kind,
          previousStatus:
            patient.status,
          nextStatus:
            updatedPatient.status,
          previousResponsiblePatientId:
            patient.responsiblePatientId,
        },
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath(
    "/dashboard/patients"
  );
  revalidatePath(
    "/dashboard/subscriptions"
  );
}
