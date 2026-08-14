"use server";

import prisma from "@/lib/prisma";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { getCurrentAuditActor } from "@/features/audit-log/services/create-audit-log";
import { createAuditLog } from "@/features/audit-log/services/create-audit-log";
import { AuditAction, AuditEntity } from "@prisma/client";
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
      "Apenas owner ou administrador da plataforma podem gerar links de pagamento."
    );
  }
}

/**
 * "Reenviar o cliente ao portal/checkout" (PAY-004): the owner cannot
 * complete a company's own checkout/portal themselves (those pages check
 * the acting user's clinicId against the session's), so this generates
 * the link and hands it back for the owner to relay through support —
 * never a form the owner fills in on the customer's behalf.
 */
export async function platformGenerateClinicPaymentLinkAction(
  formData: FormData
): Promise<{
  url: string;
  kind: "checkout" | "portal";
}> {
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
    !subscription.externalCustomerId ||
    subscription.providerKind ===
      "MANUAL"
  ) {
    throw new Error(
      "Esta empresa não está vinculada a um provedor de cobrança."
    );
  }

  const gateway = getBillingGateway();
  const actor =
    await getCurrentAuditActor();
  const needsCheckout =
    subscription.status === "TRIAL" ||
    subscription.status === "PAST_DUE";

  const result = needsCheckout
    ? {
        kind: "checkout" as const,
        url: (
          await gateway.createCheckoutSession(
            {
              clinicId:
                subscription.clinicId,
              externalCustomerId:
                subscription.externalCustomerId,
              successUrl: `/dashboard/company?tab=assinatura&checkout=success`,
              cancelUrl: `/dashboard/company?tab=assinatura&checkout=canceled`,
            }
          )
        ).url,
      }
    : {
        kind: "portal" as const,
        url: (
          await gateway.createPortalSession(
            {
              externalCustomerId:
                subscription.externalCustomerId,
              returnUrl:
                "/dashboard/company?tab=assinatura",
            }
          )
        ).url,
      };

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
      event: "payment_link_generated",
      kind: result.kind,
    },
  });

  return result;
}
