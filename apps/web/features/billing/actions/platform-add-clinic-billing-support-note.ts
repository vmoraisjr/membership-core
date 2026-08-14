"use server";

import {
  AuditAction,
  AuditEntity,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

const MAX_NOTE_LENGTH = 500;

function assertPlatformOwner(user: {
  clinicId: string | null;
  role: string;
}) {
  if (
    user.clinicId ||
    (user.role !== "OWNER" &&
      user.role !== "ADMIN")
  ) {
    throw new Error(
      "Apenas owner ou administrador da plataforma podem registrar notas de suporte de cobrança."
    );
  }
}

/**
 * A free-text support note lives in the same audit timeline as every
 * other billing event — no separate "notes" system, and it shows up
 * right alongside the gateway/webhook events it's usually explaining.
 */
export async function platformAddClinicBillingSupportNoteAction(
  formData: FormData
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  assertPlatformOwner(currentUser);

  const subscriptionId = String(
    formData.get("subscriptionId") ?? ""
  );
  const note = String(
    formData.get("note") ?? ""
  ).trim();

  if (note.length === 0) {
    throw new Error(
      "Escreva uma nota antes de salvar."
    );
  }

  const subscription =
    await prisma.clinicSubscription.findUniqueOrThrow(
      {
        where: {
          id: subscriptionId,
        },
        select: {
          id: true,
          clinicId: true,
        },
      }
    );

  const actor =
    await getCurrentAuditActor();

  await createAuditLog(prisma, {
    clinicId: subscription.clinicId,
    actor: actor.displayName,
    actorUserId: actor.id,
    action: AuditAction.UPDATE,
    entity:
      AuditEntity.CLINIC_SUBSCRIPTION,
    entityId: subscription.id,
    metadata: {
      source: "platform_support",
      event: "support_note",
      note: note.slice(
        0,
        MAX_NOTE_LENGTH
      ),
    },
  });

  safeRevalidatePath(
    `/dashboard/empresas/${subscription.clinicId}`
  );
}
