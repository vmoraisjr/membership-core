"use server";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { getCurrentAuditActor } from "@/features/audit-log/services/create-audit-log";
import { getBillingGateway } from "@/features/billing/gateway/get-billing-gateway";
import { syncClinicSubscriptionFromGateway } from "@/features/billing/services/billing-foundation";

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
      "Apenas owner ou administrador da plataforma podem sincronizar assinaturas com o provedor."
    );
  }
}

/**
 * PAY-003's "reconciliação manual/segura": re-asks the gateway for the
 * truth and applies it via the same `syncClinicSubscriptionFromGateway`
 * webhooks use — never a free-form edit. If local and gateway already
 * agree, this is a harmless no-op (no audit entry, since
 * `syncClinicSubscriptionFromGateway` only writes one when the status
 * actually changes).
 */
export async function platformResyncClinicSubscriptionAction(
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

  const actor =
    await getCurrentAuditActor();

  await syncClinicSubscriptionFromGateway(
    subscription.id,
    live,
    prisma,
    {
      actor: actor.displayName,
      actorUserId: actor.id,
    }
  );

  safeRevalidatePath(
    `/dashboard/empresas/${subscription.clinicId}`
  );
  safeRevalidatePath(
    "/dashboard/empresas"
  );
}
