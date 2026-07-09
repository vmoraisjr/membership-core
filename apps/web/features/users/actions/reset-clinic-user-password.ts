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

import { userLifecycleSchema } from "../schemas/user-management.schema";
import {
  assertUserIsNotClinicMaster,
} from "../services/manage-clinic-user";

function createTemporaryPassword() {
  return `User-${randomBytes(5).toString("hex")}!1`;
}

export async function resetClinicUserPasswordAction(
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
    await assertUserIsNotClinicMaster(
      currentUser.clinicId,
      parsed.data.userId
    );
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
        clinicId:
          currentUser.clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.APP_USER,
        entityId: targetUser.id,
        entityLabel:
          targetUser.email,
        metadata: {
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
