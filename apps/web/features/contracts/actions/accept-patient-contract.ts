"use server";
import {
  AuditAction,
  AuditEntity,
  PatientContractStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

export async function acceptPatientContractAction(
  formData: FormData
) {
  await assertPermission(
    "contracts",
    "manage"
  );

  const contractId = String(
    formData.get("contractId") ?? ""
  );
  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const contract =
    await prisma.patientContract.findFirst({
      where: {
        id: contractId,
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
    contract.status ===
    PatientContractStatus.ACCEPTED
  ) {
    return;
  }

  if (
    contract.status !==
    PatientContractStatus.ACTIVE
  ) {
    throw new Error(
      "Only active patient contracts can be accepted."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.patientContract.update({
        where: {
          id: contract.id,
        },
        data: {
          status:
            PatientContractStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      await tx.patientContractAcceptance.create({
        data: {
          patientContractId:
            contract.id,
          acceptedByUserId:
            actor.id,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.ACCEPT_CONTRACT,
        entity:
          AuditEntity.PATIENT_CONTRACT,
        entityId: contract.id,
        entityLabel:
          contract.title,
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/contracts"
  );
  safeRevalidatePath("/dashboard");
}
