"use server";

import {
  AuditAction,
  AuditEntity,
  SupportActorScope,
  SupportThreadCategory,
} from "@prisma/client";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLogSafely,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

function isCategory(
  value: string
): value is SupportThreadCategory {
  return Object.values(
    SupportThreadCategory
  ).includes(
    value as SupportThreadCategory
  );
}

export async function createSupportThreadAction(
  formData: FormData
) {
  await assertPermission(
    "messages",
    "manage"
  );

  const workspace =
    await getCurrentWorkspace();
  const actor =
    await getCurrentAuditActor();
  const subject = String(
    formData.get("subject") ?? ""
  ).trim();
  const body = String(
    formData.get("body") ?? ""
  ).trim();
  const categoryValue = String(
    formData.get("category") ?? ""
  );

  if (subject.length < 4) {
    throw new Error(
      "Informe um assunto com pelo menos 4 caracteres."
    );
  }

  if (body.length < 8) {
    throw new Error(
      "Descreva a mensagem inicial com pelo menos 8 caracteres."
    );
  }

  if (!isCategory(categoryValue)) {
    throw new Error(
      "Categoria inválida."
    );
  }

  const clinicId =
    workspace.type === "clinic"
      ? workspace.clinicId
      : String(
          formData.get("clinicId") ?? ""
        );

  if (!clinicId) {
    throw new Error(
      "Selecione a clínica do chamado."
    );
  }

  const thread =
    await prisma.$transaction(
      async (tx) => {
        const nextThread =
          await tx.supportThread.create({
            data: {
              clinicId,
              subject,
              category:
                categoryValue,
              createdByUserId:
                actor.id,
              createdByScope:
                workspace.type ===
                "platform"
                  ? SupportActorScope.PLATFORM
                  : SupportActorScope.CLINIC,
              messages: {
                create: {
                  clinicId,
                  authorUserId:
                    actor.id,
                  authorScope:
                    workspace.type ===
                    "platform"
                      ? SupportActorScope.PLATFORM
                      : SupportActorScope.CLINIC,
                  authorName:
                    actor.displayName,
                  body,
                },
              },
            },
            select: {
              id: true,
              subject: true,
            },
          });

        await createAuditLogSafely(
          tx,
          {
            clinicId,
            actor: actor.displayName,
            actorUserId: actor.id,
            action:
              AuditAction.CREATE,
            entity:
              AuditEntity.SUPPORT_THREAD,
            entityId: nextThread.id,
            entityLabel:
              nextThread.subject,
            metadata: {
              category:
                categoryValue,
              workspace:
                workspace.type,
            },
          }
        );

        return nextThread;
      }
    );

  safeRevalidatePath(
    "/dashboard/messages"
  );
  redirect(
    `/dashboard/messages?threadId=${thread.id}`
  );
}
