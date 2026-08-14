"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import prisma from "@/lib/prisma";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { resetClinicMasterPassword } from "@/features/auth/services/clinic-master";
import { safeRevalidatePath } from "@/lib/revalidation";

export async function resetClinicMasterPasswordAction(
  clinicId: string
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();

  if (currentUser.clinicId) {
    throw new Error(
      "Apenas o master da plataforma pode redefinir a senha do master da clinica."
    );
  }

  if (
    currentUser.role !== "OWNER" &&
    currentUser.role !== "ADMIN"
  ) {
    throw new Error(
      "Apenas owner ou administrador da plataforma podem redefinir a senha do master da clinica."
    );
  }

  const clinic =
    await prisma.clinic.findUnique({
      where: {
        id: clinicId,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!clinic) {
    throw new Error(
      "Clinica nao encontrada."
    );
  }

  const actor =
    await getCurrentAuditActor();
  const result =
    await prisma.$transaction(
      async (tx) => {
        const resetResult =
          await resetClinicMasterPassword(
            {
              clinicId: clinic.id,
              actorDisplayName:
                actor.displayName,
              actorUserId: actor.id,
            },
            tx
          );

        await createAuditLog(tx, {
          clinicId: clinic.id,
          actor: actor.displayName,
          actorUserId: actor.id,
          action: "UPDATE",
          entity: "CLINIC",
          entityId: clinic.id,
          entityLabel: clinic.name,
          metadata: {
            clinicMasterPasswordReset:
              true,
            clinicMasterUserId:
              resetResult.clinicMaster.id,
          },
        });

        return resetResult;
      }
    );

  safeRevalidatePath("/dashboard/clinics");
  safeRevalidatePath("/dashboard/empresas");
  safeRevalidatePath(
    `/dashboard/empresas/${clinicId}`
  );

  return {
    clinicName: clinic.name,
    clinicMasterEmail:
      result.clinicMaster.email,
    temporaryPassword:
      result.temporaryPassword,
  };
}
