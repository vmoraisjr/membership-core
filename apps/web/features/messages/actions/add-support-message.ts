"use server";

import {
  AuditAction,
  AuditEntity,
  SupportActorScope,
  SupportThreadStatus,
} from "@prisma/client";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import {
  createAuditLogSafely,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

export async function addSupportMessageAction(
  formData: FormData
) {
  const workspace =
    await getCurrentWorkspace();
  const actor =
    await getCurrentAuditActor();
  const threadId = String(
    formData.get("threadId") ?? ""
  );
  const body = String(
    formData.get("body") ?? ""
  ).trim();

  if (!threadId) {
    throw new Error(
      "Chamado inválido."
    );
  }

  if (body.length < 2) {
    throw new Error(
      "A resposta precisa ter pelo menos 2 caracteres."
    );
  }

  const thread =
    await prisma.supportThread.findFirst({
      where: {
        id: threadId,
        ...(workspace.type === "clinic"
          ? {
              clinicId:
                workspace.clinicId,
            }
          : {}),
      },
      select: {
        id: true,
        clinicId: true,
        subject: true,
      },
    });

  if (!thread) {
    throw new Error(
      "Chamado não encontrado."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const nextMessage =
        await tx.supportMessage.create({
          data: {
            threadId: thread.id,
            clinicId:
              thread.clinicId,
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
          select: {
            id: true,
          },
        });

      await tx.supportThread.update({
        where: {
          id: thread.id,
        },
        data: {
          status:
            workspace.type ===
            "platform"
              ? SupportThreadStatus.WAITING_CLINIC
              : SupportThreadStatus.WAITING_PLATFORM,
        },
      });

      await createAuditLogSafely(
        tx,
        {
          clinicId:
            thread.clinicId,
          actor: actor.displayName,
          actorUserId: actor.id,
          action:
            AuditAction.CREATE,
          entity:
            AuditEntity.SUPPORT_MESSAGE,
          entityId:
            nextMessage.id,
          entityLabel:
            thread.subject,
          metadata: {
            threadId: thread.id,
            workspace:
              workspace.type,
          },
        }
      );
    }
  );

  safeRevalidatePath(
    "/dashboard/messages"
  );
  redirect(
    `/dashboard/messages?threadId=${thread.id}`
  );
}
