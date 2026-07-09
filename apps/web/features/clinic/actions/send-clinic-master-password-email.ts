"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import prisma from "@/lib/prisma";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getClinicMasterUser } from "@/features/auth/services/clinic-master";

export async function sendClinicMasterPasswordEmailAction(
  clinicId: string,
  temporaryPassword: string
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();

  if (
    currentUser.clinicId ||
    (currentUser.role !== "OWNER" &&
      currentUser.role !== "ADMIN")
  ) {
    throw new Error(
      "Apenas owner ou administrador da plataforma podem enviar a senha do master da clinica."
    );
  }

  const [actor, clinic, clinicMaster] =
    await Promise.all([
      getCurrentAuditActor(),
      prisma.clinic.findUnique({
        where: {
          id: clinicId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
      getClinicMasterUser(clinicId),
    ]);

  if (!clinic || !clinicMaster) {
    throw new Error(
      "Clinica ou usuario master nao encontrado."
    );
  }

  await createAuditLog(prisma, {
    clinicId: clinic.id,
    actor: actor.displayName,
    actorUserId: actor.id,
    action: "UPDATE",
    entity: "APP_USER",
    entityId: clinicMaster.id,
    entityLabel: clinicMaster.email,
    metadata: {
      clinicMasterPasswordEmailRequested:
        true,
      deliveryMode:
        "manual_placeholder",
      clinicEmail: clinic.email,
    },
  });

  return {
    delivered: false,
    clinicEmail: clinic.email,
    clinicMasterEmail: clinicMaster.email,
    temporaryPassword,
    message:
      "Envio real de e-mail ainda não configurado. Use a senha exibida e encaminhe manualmente para a clínica.",
  };
}
