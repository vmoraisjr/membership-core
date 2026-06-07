"use server";

import {
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

import { userLifecycleSchema } from "../schemas/user-management.schema";
import { assertNotLastActiveOwner } from "../services/manage-clinic-user";

export async function removeClinicUserAction(
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
    userLifecycleSchema.safeParse({
      userId: String(
        formData.get("userId") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Invalid user."
    );
  }

  if (parsed.data.userId === currentUser.id) {
    throw new Error(
      "You cannot remove your own user from this screen."
    );
  }

  const targetUser =
    await assertNotLastActiveOwner(
      currentUser.clinicId,
      parsed.data.userId
    );

  await prisma.$transaction(
    async (tx) => {
      await tx.appUser.delete({
        where: {
          id: targetUser.id,
        },
      });

      await createAuditLog(tx, {
        clinicId:
          currentUser.clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.DELETE,
        entity: AuditEntity.APP_USER,
        entityId: targetUser.id,
        entityLabel:
          targetUser.email,
        metadata: {
          role: targetUser.role,
          status: targetUser.status,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/users"
  );
}
