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

import { createClinicUserSchema } from "../schemas/user-management.schema";

function createTemporaryPassword() {
  return `User-${randomBytes(5).toString("hex")}!1`;
}

export async function createPlatformUserAction(
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
      "Apenas a plataforma pode criar usuários globais."
    );
  }

  const parsed =
    createClinicUserSchema.safeParse({
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

  const email =
    parsed.data.email.toLowerCase();
  const existingUser =
    await prisma.appUser.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

  if (existingUser) {
    throw new Error(
      "Já existe um usuário com este e-mail."
    );
  }

  const temporaryPassword =
    createTemporaryPassword();

  const createdUser =
    await prisma.$transaction(
      async (tx) => {
        const nextUser =
          await tx.appUser.create({
            data: {
              clinicId: null,
              name:
                parsed.data.name,
              email,
              role: parsed.data.role,
              status:
                AppUserStatus.ACTIVE,
              passwordHash:
                hashPassword(
                  temporaryPassword
                ),
              mustChangePassword: true,
              isClinicMaster: false,
              accessStartsAt:
                parsed.data
                  .accessStartsAt
                  ? new Date(
                      parsed.data.accessStartsAt
                    )
                  : null,
              accessEndsAt:
                parsed.data
                  .accessEndsAt
                  ? new Date(
                      parsed.data.accessEndsAt
                    )
                  : null,
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          });

        await createAuditLog(tx, {
          clinicId: null,
          actor: actor.displayName,
          actorUserId: actor.id,
          action: AuditAction.CREATE,
          entity: AuditEntity.APP_USER,
          entityId: nextUser.id,
          entityLabel:
            nextUser.email,
          metadata: {
            workspace: "platform",
            role: nextUser.role,
            mustChangePassword: true,
            accessStartsAt:
              parsed.data
                .accessStartsAt ?? null,
            accessEndsAt:
              parsed.data
                .accessEndsAt ?? null,
          },
        });

        return nextUser;
      }
    );

  safeRevalidatePath(
    "/dashboard/users"
  );
  safeRevalidatePath(
    "/dashboard/administracao"
  );

  return {
    user: createdUser,
    temporaryPassword,
  };
}
