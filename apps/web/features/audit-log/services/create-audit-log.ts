import { AuditAction, AuditEntity, Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";

type AuditLogClient =
  | typeof prisma
  | Prisma.TransactionClient;

type CreateAuditLogInput = {
  clinicId?: string | null;
  actor: string;
  actorUserId?: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityLabel?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function getCurrentAuditActor() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    throw new Error(
      "Authentication required."
    );
  }

  return {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
    displayName: `${currentUser.name} <${currentUser.email}>`,
  };
}

export async function createAuditLog(
  client: AuditLogClient,
  input: CreateAuditLogInput
) {
  const currentUser =
    await getCurrentAppUser();

  if (
    currentUser?.clinicId &&
    input.clinicId &&
    input.clinicId !==
      currentUser.clinicId
  ) {
    throw new Error(
      "Cross-tenant audit logging is not allowed."
    );
  }

  return client.auditLog.create({
    data: {
      clinicId: input.clinicId ?? null,
      actor: input.actor,
      actorUserId:
        input.actorUserId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      entityLabel: input.entityLabel ?? null,
      metadata: input.metadata,
    },
  });
}
