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

import { revokeInviteSchema } from "../schemas/user-management.schema";

export async function revokeUserInviteAction(
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
    revokeInviteSchema.safeParse({
      inviteId: String(
        formData.get("inviteId") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Invalid invite."
    );
  }

  const invite =
    await prisma.userInvite.findFirst({
      where: {
        id: parsed.data.inviteId,
        clinicId: currentUser.clinicId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });

  if (!invite) {
    throw new Error("Invite not found.");
  }

  if (invite.acceptedAt) {
    throw new Error(
      "Accepted invites cannot be revoked."
    );
  }

  if (invite.revokedAt) {
    return;
  }

  await prisma.$transaction(
      async (tx) => {
        const nextInvite =
          await tx.userInvite.update({
            where: {
              id: invite.id,
            },
            data: {
              revokedAt: new Date(),
            },
            select: {
              id: true,
              email: true,
              role: true,
              acceptedAt: true,
              revokedAt: true,
            },
          });

        await createAuditLog(tx, {
          clinicId:
            currentUser.clinicId,
          actor: actor.displayName,
          actorUserId: actor.id,
          action: AuditAction.UPDATE,
          entity: AuditEntity.USER_INVITE,
          entityId: nextInvite.id,
          entityLabel:
            nextInvite.email,
          metadata: {
            revoked: true,
            role: nextInvite.role,
          },
        });

        return nextInvite;
      }
    );

  safeRevalidatePath(
    "/dashboard/users"
  );
}
