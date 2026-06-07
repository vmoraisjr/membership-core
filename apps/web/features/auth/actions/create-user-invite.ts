"use server";

import { AppUserRole } from "@prisma/client";

import prisma from "@/lib/prisma";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { canAssignRole } from "@/features/rbac/permissions";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { requireCurrentAppUser } from "../services/get-current-app-user";
import { createUserInvite } from "../services/create-user-invite";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createUserInviteAction(
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
  const email = normalizeEmail(
    String(
      formData.get("email") ?? ""
    )
  );
  const role = String(
    formData.get("role") ?? "STAFF"
  );

  if (
    !Object.values(
      AppUserRole
    ).includes(role as AppUserRole)
  ) {
    throw new Error("Invalid role.");
  }

  if (
    !canAssignRole(
      currentUser.role,
      role as AppUserRole
    )
  ) {
    throw new Error(
      "You do not have permission to assign this role."
    );
  }

  const result =
    await prisma.$transaction(
      async (tx) => {
        const invite =
          await createUserInvite(
            {
              clinicId:
                currentUser.clinicId,
              email,
              role:
                role as AppUserRole,
              invitedByUserId:
                currentUser.id,
            },
            tx
          );

        await createAuditLog(tx, {
          clinicId:
            currentUser.clinicId,
          actor: actor.displayName,
          actorUserId: actor.id,
          action: "CREATE",
          entity: "USER_INVITE",
          entityId: invite.invite.id,
          entityLabel:
            invite.invite.email,
          metadata: {
            role: invite.invite.role,
            expiresAt:
              invite.invite.expiresAt.toISOString(),
          },
        });

        return invite;
      }
    );

  return {
    token: result.token,
    expiresAt: result.expiresAt,
  };
}
