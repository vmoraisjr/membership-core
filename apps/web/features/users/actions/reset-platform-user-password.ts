"use server";

import { randomBytes } from "node:crypto";

import {
  AppUserStatus,
  AuditAction,
  AuditEntity,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { safeRevalidatePath } from "@/lib/revalidation";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { userLifecycleSchema } from "../schemas/user-management.schema";

function createTemporaryPassword() {
  return `User-${randomBytes(5).toString("hex")}!1`;
}

export async function resetPlatformUserPasswordAction(
  formData: FormData
) {
  const workspace =
    await getCurrentWorkspace();
  const actor =
    await getCurrentAuditActor();

  if (
    workspace.type !== "platform" ||
    !workspace.canManagePlatform
  ) {
    throw new Error(
      "Apenas a plataforma pode resetar usuários globais."
    );
  }

  const parsed =
    userLifecycleSchema.safeParse({
      userId: String(
        formData.get("userId") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Usuário inválido."
    );
  }

  const targetUser =
    await prisma.appUser.findFirst({
      where: {
        id: parsed.data.userId,
        clinicId: null,
      },
      select: {
        id: true,
        email: true,
      },
    });

  if (!targetUser) {
    throw new Error(
      "Usuário da plataforma não encontrado."
    );
  }

  const temporaryPassword =
    createTemporaryPassword();

  await prisma.$transaction(
    async (tx) => {
      await tx.appUser.update({
        where: {
          id: targetUser.id,
        },
        data: {
          passwordHash:
            hashPassword(
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
        clinicId: null,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.APP_USER,
        entityId: targetUser.id,
        entityLabel:
          targetUser.email,
        metadata: {
          workspace: "platform",
          passwordReset: true,
          mustChangePassword: true,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/users"
  );

  return {
    userId: targetUser.id,
    email: targetUser.email,
    temporaryPassword,
  };
}
