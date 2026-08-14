"use server";

import {
  AuditAction,
  AuditEntity,
  SupportActorScope,
  SupportThreadStatus,
} from "@prisma/client";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLogSafely,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import {
  resolveSupportReturnTo,
  revalidateSupportPaths,
  withThreadId,
} from "../utils/support-navigation";

export async function addSupportMessageAction(
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

  revalidateSupportPaths(
    thread.clinicId
  );
  redirect(
    withThreadId(
      resolveSupportReturnTo(
        formData,
        workspace.type === "platform"
          ? "/dashboard/chamados"
          : "/dashboard/messages"
      ),
      thread.id
    )
  );
}
