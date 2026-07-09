"use server";

import {
  AppUserStatus,
  AuditAction,
  AuditEntity,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { assertPermission } from "@/features/rbac/services/assert-permission";

import { updateUserStatusSchema } from "../schemas/user-management.schema";
import {
  assertNotLastActiveOwner,
  assertUserIsNotClinicMaster,
} from "../services/manage-clinic-user";

export async function updateClinicUserStatusAction(
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
      "The current user is not assigned to a clinic."
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
        "Invalid user status."
    );
  }

  if (parsed.data.userId === currentUser.id) {
    throw new Error(
      "You cannot change your own status from this screen."
    );
  }

  const targetUser =
    await assertUserIsNotClinicMaster(
      currentUser.clinicId,
      parsed.data.userId
    );

  if (
    targetUser.status ===
    parsed.data.status
  ) {
    return;
  }

  if (
    parsed.data.status ===
      AppUserStatus.INACTIVE &&
    targetUser.role === "OWNER"
  ) {
    await assertNotLastActiveOwner(
      currentUser.clinicId,
      targetUser.id
    );
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
              name: true,
              email: true,
              role: true,
              status: true,
            },
          });

        await createAuditLog(tx, {
          clinicId:
            currentUser.clinicId,
          actor: actor.displayName,
          actorUserId: actor.id,
          action: AuditAction.UPDATE,
          entity: AuditEntity.APP_USER,
          entityId: nextUser.id,
          entityLabel:
            nextUser.email,
          metadata: {
            previousStatus:
              targetUser.status,
            nextStatus:
              nextUser.status,
          },
        });

        return nextUser;
      }
    );

  safeRevalidatePath(
    "/dashboard/users"
  );
}
