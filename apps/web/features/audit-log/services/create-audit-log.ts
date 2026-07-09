import { AuditAction, AuditEntity, Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

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

  const auditLogDelegate = (
    client as AuditLogClient & {
      auditLog?: {
        create?: (
          args: {
            data: {
              clinicId: string | null;
              actor: string;
              action: AuditAction;
              entity: AuditEntity;
              entityId: string;
              entityLabel: string | null;
              metadata:
                | Prisma.InputJsonValue
                | typeof Prisma.JsonNull;
              actorUserId: string | null;
            };
            select: {
              id: true;
            };
          }
        ) => Promise<{ id: string }>;
      };
    }
  ).auditLog;

  if (
    typeof auditLogDelegate?.create ===
    "function"
  ) {
    return auditLogDelegate.create({
      data: {
        clinicId: input.clinicId ?? null,
        actor: input.actor,
        action: input.action as AuditAction,
        entity: input.entity as AuditEntity,
        entityId: input.entityId,
        entityLabel:
          input.entityLabel ?? null,
        metadata:
          input.metadata == null
            ? Prisma.JsonNull
            : input.metadata,
        actorUserId:
          input.actorUserId ?? null,
      },
      select: {
        id: true,
      },
    });
  }

  const result =
    await client.$queryRaw<
      Array<{ id: string }>
    >`
      INSERT INTO "AuditLog" (
        "clinicId",
        "actorUserId",
        "actor",
        "action",
        "entity",
        "entityId",
        "entityLabel",
        "metadata"
      )
      VALUES (
        ${input.clinicId ?? null},
        ${input.actorUserId ?? null},
        ${input.actor},
        CAST(${input.action} AS "AuditAction"),
        CAST(${input.entity} AS "AuditEntity"),
        ${input.entityId},
        ${input.entityLabel ?? null},
        CAST(${
          input.metadata == null
            ? null
            : JSON.stringify(input.metadata)
        } AS jsonb)
      )
      RETURNING "id"
    `;

  return result[0];
}

export async function createAuditLogSafely(
  client: AuditLogClient,
  input: CreateAuditLogInput
) {
  try {
    return await createAuditLog(
      client,
      input
    );
  } catch (error) {
    logger.warn(
      "Audit log write failed.",
      {
        clinicId:
          input.clinicId ?? null,
        actor: input.actor,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }
    );

    return null;
  }
}
