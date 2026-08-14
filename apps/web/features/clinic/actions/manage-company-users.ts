"use server";

import { randomBytes } from "node:crypto";

import { AppUserStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { canAssignRole } from "@/features/rbac/permissions";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { createUserInvite } from "@/features/auth/services/create-user-invite";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  createClinicUserSchema,
  revokeInviteSchema,
  updateClinicUserSchema,
  updateUserStatusSchema,
  userLifecycleSchema,
} from "../../users/schemas/user-management.schema";
import {
  assertNotLastActiveOwner,
  assertUserIsNotClinicMaster,
} from "../../users/services/manage-clinic-user";

function createTemporaryPassword() {
  return `User-${randomBytes(5).toString("hex")}!1`;
}

/**
 * Every action here targets a `clinicId` supplied by the caller (a
 * platform admin viewing an arbitrary company workspace), not the acting
 * user's own clinic — unlike the self-service actions in `features/users`.
 */
async function assertPlatformCanManageCompanyUsers() {
  await assertPermission(
    "clinic",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();

  if (
    currentUser.clinicId ||
    (currentUser.role !== "OWNER" &&
      currentUser.role !== "ADMIN")
  ) {
    throw new Error(
      "Apenas owner ou administrador da plataforma podem administrar usuários de empresas."
    );
  }

  return currentUser;
}

function revalidateCompanyPeople(
  clinicId: string
) {
  safeRevalidatePath(
    `/dashboard/empresas/${clinicId}`
  );
}

export async function createCompanyUserAction(
  formData: FormData
) {
  const currentUser =
    await assertPlatformCanManageCompanyUsers();
  const actor =
    await getCurrentAuditActor();
  const clinicId = String(
    formData.get("clinicId") ?? ""
  );

  if (!clinicId) {
    throw new Error(
      "Empresa não informada."
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

  if (
    !canAssignRole(
      currentUser.role,
      parsed.data.role
    )
  ) {
    throw new Error(
      "Você não tem permissão para atribuir esse perfil."
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
              clinicId,
              name: parsed.data.name,
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
          clinicId,
          actor: actor.displayName,
          actorUserId: actor.id,
          action: "CREATE",
          entity: "APP_USER",
          entityId: nextUser.id,
          entityLabel: nextUser.email,
          metadata: {
            role: nextUser.role,
            mustChangePassword: true,
            createdByPlatform: true,
          },
        });

        return nextUser;
      }
    );

  revalidateCompanyPeople(clinicId);

  return {
    user: createdUser,
    temporaryPassword,
  };
}

export async function updateCompanyUserDetailsAction(
  formData: FormData
) {
  const currentUser =
    await assertPlatformCanManageCompanyUsers();
  const actor =
    await getCurrentAuditActor();
  const clinicId = String(
    formData.get("clinicId") ?? ""
  );

  if (!clinicId) {
    throw new Error(
      "Empresa não informada."
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

  if (
    !canAssignRole(
      currentUser.role,
      parsed.data.role
    )
  ) {
    throw new Error(
      "Você não tem permissão para atribuir esse perfil."
    );
  }

  const targetUser =
    await assertUserIsNotClinicMaster(
      clinicId,
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
        clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: "UPDATE",
        entity: "APP_USER",
        entityId: nextUser.id,
        entityLabel: nextUser.email,
        metadata: {
          previousRole: targetUser.role,
          nextRole: nextUser.role,
          updatedByPlatform: true,
        },
      });
    }
  );

  revalidateCompanyPeople(clinicId);
}

export async function updateCompanyUserStatusAction(
  formData: FormData
) {
  await assertPlatformCanManageCompanyUsers();
  const actor =
    await getCurrentAuditActor();
  const clinicId = String(
    formData.get("clinicId") ?? ""
  );

  if (!clinicId) {
    throw new Error(
      "Empresa não informada."
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

  const targetUser =
    await assertUserIsNotClinicMaster(
      clinicId,
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
      clinicId,
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
            status: parsed.data.status,
          },
          select: {
            id: true,
            email: true,
            status: true,
          },
        });

      await createAuditLog(tx, {
        clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: "UPDATE",
        entity: "APP_USER",
        entityId: nextUser.id,
        entityLabel: nextUser.email,
        metadata: {
          previousStatus:
            targetUser.status,
          nextStatus: nextUser.status,
          updatedByPlatform: true,
        },
      });
    }
  );

  revalidateCompanyPeople(clinicId);
}

export async function removeCompanyUserAction(
  formData: FormData
) {
  await assertPlatformCanManageCompanyUsers();
  const actor =
    await getCurrentAuditActor();
  const clinicId = String(
    formData.get("clinicId") ?? ""
  );

  if (!clinicId) {
    throw new Error(
      "Empresa não informada."
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

  await assertUserIsNotClinicMaster(
    clinicId,
    parsed.data.userId
  );

  const targetUser =
    await assertNotLastActiveOwner(
      clinicId,
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
        clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: "DELETE",
        entity: "APP_USER",
        entityId: targetUser.id,
        entityLabel: targetUser.email,
        metadata: {
          role: targetUser.role,
          status: targetUser.status,
          removedByPlatform: true,
        },
      });
    }
  );

  revalidateCompanyPeople(clinicId);
}

export async function inviteCompanyUserAction(
  formData: FormData
) {
  const currentUser =
    await assertPlatformCanManageCompanyUsers();
  const actor =
    await getCurrentAuditActor();
  const clinicId = String(
    formData.get("clinicId") ?? ""
  );

  if (!clinicId) {
    throw new Error(
      "Empresa não informada."
    );
  }

  const email = String(
    formData.get("email") ?? ""
  )
    .trim()
    .toLowerCase();
  const role = String(
    formData.get("role") ?? "STAFF"
  );

  if (
    !canAssignRole(
      currentUser.role,
      role as never
    )
  ) {
    throw new Error(
      "Você não tem permissão para atribuir esse perfil."
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const invite =
        await createUserInvite(
          {
            clinicId,
            email,
            role: role as never,
            invitedByUserId:
              currentUser.id,
          },
          tx
        );

      await createAuditLog(tx, {
        clinicId,
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
          invitedByPlatform: true,
        },
      });

      return invite;
    }
  );

  revalidateCompanyPeople(clinicId);

  return {
    token: result.token,
    expiresAt: result.expiresAt,
  };
}

export async function revokeCompanyUserInviteAction(
  formData: FormData
) {
  await assertPlatformCanManageCompanyUsers();
  const actor =
    await getCurrentAuditActor();
  const clinicId = String(
    formData.get("clinicId") ?? ""
  );

  if (!clinicId) {
    throw new Error(
      "Empresa não informada."
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
        "Convite inválido."
    );
  }

  const invite =
    await prisma.userInvite.findFirst({
      where: {
        id: parsed.data.inviteId,
        clinicId,
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
    throw new Error(
      "Convite não encontrado."
    );
  }

  if (invite.acceptedAt) {
    throw new Error(
      "Convites aceitos não podem ser revogados."
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
          },
        });

      await createAuditLog(tx, {
        clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: "UPDATE",
        entity: "USER_INVITE",
        entityId: nextInvite.id,
        entityLabel: nextInvite.email,
        metadata: {
          revoked: true,
          role: nextInvite.role,
          revokedByPlatform: true,
        },
      });
    }
  );

  revalidateCompanyPeople(clinicId);
}
