"use server";

import {
  AuditAction,
  AuditEntity,
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

function isStatus(
  value: string
): value is SupportThreadStatus {
  return Object.values(
    SupportThreadStatus
  ).includes(
    value as SupportThreadStatus
  );
}

export async function updateSupportThreadStatusAction(
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
  const statusValue = String(
    formData.get("status") ?? ""
  );

  if (!threadId || !isStatus(statusValue)) {
    throw new Error(
      "Dados inválidos para atualizar o chamado."
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
        status: true,
      },
    });

  if (!thread) {
    throw new Error(
      "Chamado não encontrado."
    );
  }

  await prisma.supportThread.update({
    where: {
      id: thread.id,
    },
    data: {
      status: statusValue,
    },
  });

  await createAuditLogSafely(
    prisma,
    {
      clinicId: thread.clinicId,
      actor: actor.displayName,
      actorUserId: actor.id,
      action: AuditAction.UPDATE,
      entity:
        AuditEntity.SUPPORT_THREAD,
      entityId: thread.id,
      entityLabel: thread.subject,
      metadata: {
        previousStatus:
          thread.status,
        nextStatus: statusValue,
        workspace:
          workspace.type,
      },
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
