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
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { assertPermission } from "@/features/rbac/services/assert-permission";

import { createClinicUserSchema } from "../schemas/user-management.schema";

function createTemporaryPassword() {
  return `User-${randomBytes(5).toString("hex")}!1`;
}

export async function createClinicUserAction(
  formData: FormData
) {
  await assertPermission(
    "users",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  const actor =
    await getCurrentAuditActor();

  if (!currentUser.clinicId) {
    throw new Error(
      "O usuário atual precisa estar vinculado a uma clínica."
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
        clinicId: true,
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
              clinicId:
                currentUser.clinicId,
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
          clinicId:
            currentUser.clinicId,
          actor: actor.displayName,
          actorUserId: actor.id,
          action: AuditAction.CREATE,
          entity: AuditEntity.APP_USER,
          entityId: nextUser.id,
          entityLabel:
            nextUser.email,
          metadata: {
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

  return {
    user: createdUser,
    temporaryPassword,
  };
}
