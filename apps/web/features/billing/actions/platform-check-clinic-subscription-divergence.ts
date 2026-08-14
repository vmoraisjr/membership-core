"use server";

import {
  AuditAction,
  AuditEntity,
  BillingSyncStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { getBillingGateway } from "@/features/billing/gateway/get-billing-gateway";

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
      "Apenas owner ou administrador da plataforma podem verificar divergências de cobrança."
    );
  }
}

/**
 * Detect-only step of PAY-004's reconciliation flow: asks the gateway
 * for the truth and flags `syncStatus: DIVERGED` if it disagrees with
 * the local record — but does NOT apply the correction. An owner reviews
 * the flag, then explicitly runs `platformResyncClinicSubscriptionAction`
 * (PAY-003) to apply it. Keeps "detect" and "correct" as two deliberate
 * steps, never a silent auto-fix.
 */
export async function platformCheckClinicSubscriptionDivergenceAction(
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
  const subscription =
    await prisma.clinicSubscription.findUniqueOrThrow(
      {
        where: {
          id: subscriptionId,
        },
      }
    );

  if (
    !subscription.externalSubscriptionId ||
    subscription.providerKind ===
      "MANUAL"
  ) {
    throw new Error(
      "Esta assinatura não está vinculada a um provedor de cobrança."
    );
  }

  const gateway = getBillingGateway();
  const live =
    await gateway.getSubscription(
      subscription.externalSubscriptionId
    );

  if (!live) {
    throw new Error(
      "Assinatura não encontrada no provedor de cobrança."
    );
  }

  const stateToStatus: Record<
    string,
    string
  > = {
    trialing: "TRIAL",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    paused: "PAUSED",
    canceled: "CANCELED",
  };
  const diverged =
    stateToStatus[live.state] !==
    subscription.status;

  await prisma.clinicSubscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      syncStatus: diverged
        ? BillingSyncStatus.DIVERGED
        : BillingSyncStatus.SYNCED,
      lastSyncedAt: new Date(),
    },
  });

  if (diverged) {
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
        source: "manual_check",
        event: "divergence_detected",
        localStatus:
          subscription.status,
        gatewayState: live.state,
      },
    });
  }

  safeRevalidatePath(
    `/dashboard/empresas/${subscription.clinicId}`
  );
  safeRevalidatePath(
    "/dashboard/empresas"
  );
}
