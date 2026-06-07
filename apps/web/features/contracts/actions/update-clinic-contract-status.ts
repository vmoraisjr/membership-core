"use server";

import {
  AuditAction,
  AuditEntity,
  ClinicContractStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { createAuditLog, getCurrentAuditActor } from "@/features/audit-log/services/create-audit-log";

import { clinicContractStatusSchema } from "../schemas/clinic-contract.schema";

function canTransitionClinicContract(
  currentStatus: ClinicContractStatus,
  nextStatus: ClinicContractStatus
) {
  if (currentStatus === nextStatus) {
    return true;
  }

  switch (currentStatus) {
    case ClinicContractStatus.PENDING_SIGNATURE:
      return (
        nextStatus ===
          ClinicContractStatus.ACTIVE ||
        nextStatus ===
          ClinicContractStatus.CANCELED
      );
    case ClinicContractStatus.ACTIVE:
      return (
        nextStatus ===
          ClinicContractStatus.SUSPENDED ||
        nextStatus ===
          ClinicContractStatus.CANCELED
      );
    case ClinicContractStatus.SUSPENDED:
      return (
        nextStatus ===
          ClinicContractStatus.ACTIVE ||
        nextStatus ===
          ClinicContractStatus.CANCELED
      );
    default:
      return false;
  }
}

export async function updateClinicContractStatusAction(
  formData: FormData
) {
  await assertPermission(
    "contracts",
    "manage"
  );

  const parsed =
    clinicContractStatusSchema.safeParse({
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
        "Invalid clinic contract status."
    );
  }

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const contract =
    await prisma.clinicContract.findFirst({
      where: {
        id: parsed.data.contractId,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        signedAt: true,
        effectiveAt: true,
      },
    });

  if (!contract) {
    throw new Error(
      "Clinic contract not found."
    );
  }

  if (
    !canTransitionClinicContract(
      contract.status,
      parsed.data.status
    )
  ) {
    throw new Error(
      "This clinic contract transition is not allowed in V1."
    );
  }

  if (
    contract.status ===
    parsed.data.status
  ) {
    return;
  }

  const now = new Date();

  await prisma.$transaction(
      async (tx) => {
        const nextContract =
          await tx.clinicContract.update({
            where: {
              id: contract.id,
            },
            data: {
              status:
                parsed.data.status,
              ...(parsed.data.status ===
              ClinicContractStatus.ACTIVE
                ? {
                    signedAt:
                      contract.signedAt ??
                      now,
                    effectiveAt:
                      contract.effectiveAt ??
                      now,
                  }
                : {}),
            },
            select: {
              id: true,
              title: true,
              status: true,
              signedAt: true,
              effectiveAt: true,
            },
          });

        await createAuditLog(tx, {
          clinicId: clinic.id,
          actor: actor.displayName,
          actorUserId: actor.id,
          action: AuditAction.UPDATE,
          entity:
            AuditEntity.CLINIC_CONTRACT,
          entityId: contract.id,
          entityLabel: contract.title,
          metadata: {
            previousStatus:
              contract.status,
            nextStatus:
              parsed.data.status,
          },
        });

        return nextContract;
      }
    );

  safeRevalidatePath(
    "/dashboard/contracts"
  );
  safeRevalidatePath("/dashboard");
}
