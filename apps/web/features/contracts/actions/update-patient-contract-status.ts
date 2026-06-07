"use server";

import {
  AuditAction,
  AuditEntity,
  PatientContractStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { assertPermission } from "@/features/rbac/services/assert-permission";

import { patientContractStatusSchema } from "../schemas/patient-contract.schema";

function canTransitionPatientContract(
  currentStatus: PatientContractStatus,
  nextStatus: PatientContractStatus
) {
  if (currentStatus === nextStatus) {
    return true;
  }

  switch (currentStatus) {
    case PatientContractStatus.DRAFT:
      return (
        nextStatus ===
          PatientContractStatus.ACTIVE ||
        nextStatus ===
          PatientContractStatus.ARCHIVED
      );
    case PatientContractStatus.ACTIVE:
      return (
        nextStatus ===
        PatientContractStatus.ARCHIVED
      );
    case PatientContractStatus.ACCEPTED:
      return (
        nextStatus ===
        PatientContractStatus.ARCHIVED
      );
    default:
      return false;
  }
}

export async function updatePatientContractStatusAction(
  formData: FormData
) {
  await assertPermission(
    "contracts",
    "manage"
  );

  const parsed =
    patientContractStatusSchema.safeParse({
      contractId: String(
        formData.get("contractId") ?? ""
      ),
      status: String(
        formData.get("status") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Invalid patient contract status."
    );
  }

  if (
    parsed.data.status ===
    PatientContractStatus.ACCEPTED
  ) {
    throw new Error(
      "Accepted status must be recorded through contract acceptance."
    );
  }

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const contract =
    await prisma.patientContract.findFirst({
      where: {
        id: parsed.data.contractId,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

  if (!contract) {
    throw new Error(
      "Patient contract not found."
    );
  }

  if (
    !canTransitionPatientContract(
      contract.status,
      parsed.data.status
    )
  ) {
    throw new Error(
      "This patient contract transition is not allowed in V1."
    );
  }

  if (
    contract.status ===
    parsed.data.status
  ) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.patientContract.update({
        where: {
          id: contract.id,
        },
        data: {
          status:
            parsed.data.status,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity:
          AuditEntity.PATIENT_CONTRACT,
        entityId: contract.id,
        entityLabel: contract.title,
        metadata: {
          previousStatus:
            contract.status,
          nextStatus:
            parsed.data.status,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/contracts"
  );
}
