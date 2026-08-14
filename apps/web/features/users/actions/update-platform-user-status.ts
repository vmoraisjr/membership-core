"use server";

import {
  AppUserRole,
  AppUserStatus,
  AuditAction,
  AuditEntity,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { updateUserStatusSchema } from "../schemas/user-management.schema";

export async function updatePlatformUserStatusAction(
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
      "Apenas a plataforma pode alterar usuários globais."
    );
  }

  const parsed =
    updateUserStatusSchema.safeParse({
      userId: String(
        formData.get("userId") ?? ""
      ),
      status: String(
        formData.get("status") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Status inválido."
    );
  }

  if (
    parsed.data.userId ===
    workspace.currentUser.id
  ) {
    throw new Error(
      "Você não pode alterar seu próprio status nesta tela."
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
        role: true,
        status: true,
        passwordHash: true,
      },
    });

  if (!targetUser) {
    throw new Error(
      "Usuário da plataforma não encontrado."
    );
  }

  if (
    targetUser.status ===
    parsed.data.status
  ) {
    return;
  }

  if (
    parsed.data.status ===
      AppUserStatus.INACTIVE &&
    targetUser.role === AppUserRole.OWNER
  ) {
    const activeOwnerCount =
      await prisma.appUser.count({
        where: {
          clinicId: null,
          role: AppUserRole.OWNER,
          status: AppUserStatus.ACTIVE,
        },
      });

    if (activeOwnerCount <= 1) {
      throw new Error(
        "O último owner ativo da plataforma não pode ser desativado."
      );
    }
  }

  if (
    parsed.data.status ===
      AppUserStatus.ACTIVE &&
    targetUser.status ===
      AppUserStatus.PENDING &&
    !targetUser.passwordHash
  ) {
    throw new Error(
      "Este usuário ainda não possui credenciais válidas para ativação."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const nextUser =
        await tx.appUser.update({
          where: {
            id: targetUser.id,
          },
          data: {
            status:
              parsed.data.status,
          },
          select: {
            id: true,
            email: true,
            status: true,
          },
        });

      await createAuditLog(tx, {
        clinicId: null,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.APP_USER,
        entityId: nextUser.id,
        entityLabel:
          nextUser.email,
        metadata: {
          workspace: "platform",
          previousStatus:
            targetUser.status,
          nextStatus:
            nextUser.status,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/users"
  );
  safeRevalidatePath(
    "/dashboard/administracao"
  );
}
