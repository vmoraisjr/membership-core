"use server";

import {
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

import { updateClinicUserSchema } from "../schemas/user-management.schema";

export async function updatePlatformUserDetailsAction(
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
      "Apenas a plataforma pode editar usuários globais."
    );
  }

  const parsed =
    updateClinicUserSchema.safeParse({
      userId: String(
        formData.get("userId") ?? ""
      ),
      name: String(
        formData.get("name") ?? ""
      ),
      email: String(
        formData.get("email") ?? ""
      ),
      role: String(
        formData.get("role") ?? ""
      ),
      accessStartsAt: String(
        formData.get("accessStartsAt") ?? ""
      ),
      accessEndsAt: String(
        formData.get("accessEndsAt") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Dados inválidos."
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
      },
    });

  if (!targetUser) {
    throw new Error(
      "Usuário da plataforma não encontrado."
    );
  }

  const email =
    parsed.data.email.toLowerCase();
  const conflictingUser =
    await prisma.appUser.findFirst({
      where: {
        email,
        NOT: {
          id: targetUser.id,
        },
      },
      select: {
        id: true,
      },
    });

  if (conflictingUser) {
    throw new Error(
      "Já existe outro usuário com este e-mail."
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
            name: parsed.data.name,
            email,
            role: parsed.data.role,
            accessStartsAt:
              parsed.data.accessStartsAt
                ? new Date(
                    parsed.data.accessStartsAt
                  )
                : null,
            accessEndsAt:
              parsed.data.accessEndsAt
                ? new Date(
                    parsed.data.accessEndsAt
                  )
                : null,
          },
          select: {
            id: true,
            email: true,
            role: true,
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
          previousRole:
            targetUser.role,
          nextRole:
            nextUser.role,
          accessStartsAt:
            parsed.data
              .accessStartsAt ?? null,
          accessEndsAt:
            parsed.data
              .accessEndsAt ?? null,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/users"
  );
}
