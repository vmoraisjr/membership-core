import { randomUUID } from "node:crypto";

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
  action: AuditAction | "LOGIN";
  entity:
    | AuditEntity
    | "APP_USER"
    | "USER_INVITE";
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

async function getAuditContextUser() {
  try {
    return await getCurrentAppUser();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "outside a request scope"
      )
    ) {
      return null;
    }

    throw error;
  }
}

export async function createAuditLog(
  client: AuditLogClient,
  input: CreateAuditLogInput
) {
  const currentUser =
    await getAuditContextUser();

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

  const metadata =
    input.metadata == null
      ? null
      : JSON.stringify(input.metadata);
  const auditLogId =
    randomUUID();

  const result =
    await client.$queryRaw<
      Array<{ id: string }>
    >`
      INSERT INTO "AuditLog" (
        "id",
        "clinicId",
        "actor",
        "action",
        "entity",
        "entityId",
        "entityLabel",
        "metadata",
        "actorUserId"
      )
      VALUES (
        ${auditLogId},
        ${input.clinicId ?? null},
        ${input.actor},
        ${input.action}::"AuditAction",
        ${input.entity}::"AuditEntity",
        ${input.entityId},
        ${input.entityLabel ?? null},
        ${metadata}::jsonb,
        ${input.actorUserId ?? null}
      )
      RETURNING "id"
    `;

  return result[0] ?? null;
}
