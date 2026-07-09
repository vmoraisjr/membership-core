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

import { updateClinicUserSchema } from "../schemas/user-management.schema";
import {
  assertUserIsNotClinicMaster,
} from "../services/manage-clinic-user";

export async function updateClinicUserDetailsAction(
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
    await assertUserIsNotClinicMaster(
      currentUser.clinicId,
      parsed.data.userId
    );

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
