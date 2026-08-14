"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import prisma from "@/lib/prisma";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

export async function sendCompanyUserPasswordEmailAction(
  userId: string,
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
      "Apenas owner ou administrador da plataforma podem enviar a senha de usuários de empresas."
    );
  }

  const [actor, targetUser] =
    await Promise.all([
      getCurrentAuditActor(),
      prisma.appUser.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
          clinicId: true,
        },
      }),
    ]);

  if (!targetUser || !targetUser.clinicId) {
    throw new Error(
      "Usuário da empresa não encontrado."
    );
  }

  await createAuditLog(prisma, {
    clinicId: targetUser.clinicId,
    actor: actor.displayName,
    actorUserId: actor.id,
    action: "UPDATE",
    entity: "APP_USER",
    entityId: targetUser.id,
    entityLabel: targetUser.email,
    metadata: {
      companyUserPasswordEmailRequested:
        true,
      deliveryMode:
        "manual_placeholder",
    },
  });

  return {
    delivered: false,
    userEmail: targetUser.email,
    temporaryPassword,
    message:
      "Envio real de e-mail ainda não configurado. Use a senha exibida e encaminhe manualmente para o usuário.",
  };
}
