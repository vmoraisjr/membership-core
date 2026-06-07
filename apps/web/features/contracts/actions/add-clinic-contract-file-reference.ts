"use server";

import {
  AuditAction,
  AuditEntity,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { createAuditLog, getCurrentAuditActor } from "@/features/audit-log/services/create-audit-log";

import { clinicContractFileReferenceSchema } from "../schemas/clinic-contract.schema";

export async function addClinicContractFileReferenceAction(
  formData: FormData
) {
  await assertPermission(
    "contracts",
    "manage"
  );

  const parsed =
    clinicContractFileReferenceSchema.safeParse({
      contractId: String(
        formData.get("contractId") ?? ""
      ),
      fileName: String(
        formData.get("fileName") ?? ""
      ),
      fileUrl: String(
        formData.get("fileUrl") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Invalid clinic contract file."
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
      },
    });

  if (!contract) {
    throw new Error(
      "Clinic contract not found."
    );
  }

  await prisma.$transaction(
      async (tx) => {
        const existing =
          await tx.clinicContractFile.findFirst({
            where: {
              clinicContractId:
                contract.id,
              fileUrl:
                parsed.data.fileUrl,
            },
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
            },
          });

        if (existing) {
          return existing;
        }

        const file =
          await tx.clinicContractFile.create({
            data: {
              clinicContractId:
                contract.id,
              fileName:
                parsed.data.fileName,
              fileUrl:
                parsed.data.fileUrl,
            },
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
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
            fileReferenceId: file.id,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
          },
        });

        return file;
      }
    );

  safeRevalidatePath(
    "/dashboard/contracts"
  );
}
