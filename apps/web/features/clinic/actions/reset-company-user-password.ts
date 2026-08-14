"use server";

import { randomBytes } from "node:crypto";

import { AppUserStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

function createTemporaryPassword() {
  return `User-${randomBytes(5).toString("hex")}!1`;
}

export async function resetCompanyUserPasswordAction(
  userId: string
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
      "Apenas owner ou administrador da plataforma podem redefinir a senha de usuários de empresas."
    );
  }

  const targetUser =
    await prisma.appUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        clinicId: true,
      },
    });

  if (!targetUser || !targetUser.clinicId) {
    throw new Error(
      "Usuário da empresa não encontrado."
    );
  }

  const actor =
    await getCurrentAuditActor();
  const temporaryPassword =
    createTemporaryPassword();

  await prisma.$transaction(
    async (tx) => {
      await tx.appUser.update({
        where: {
          id: targetUser.id,
        },
        data: {
          passwordHash: hashPassword(
            temporaryPassword
          ),
          mustChangePassword: true,
          status: AppUserStatus.ACTIVE,
        },
      });

      await tx.authSession.deleteMany({
        where: {
          appUserId: targetUser.id,
        },
      });

      await createAuditLog(tx, {
        clinicId: targetUser.clinicId as string,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: "UPDATE",
        entity: "APP_USER",
        entityId: targetUser.id,
        entityLabel: targetUser.email,
        metadata: {
          passwordReset: true,
          mustChangePassword: true,
          resetByPlatform: true,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/clinics"
  );

  return {
    userId: targetUser.id,
    email: targetUser.email,
    temporaryPassword,
  };
}
