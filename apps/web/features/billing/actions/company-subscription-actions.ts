"use server";

import { redirect } from "next/navigation";

import {
  AuditAction,
  AuditEntity,
  ClinicSubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { getBillingGateway } from "@/features/billing/gateway/get-billing-gateway";
import { syncClinicSubscriptionFromGateway } from "@/features/billing/services/billing-foundation";

const COMPANY_SUBSCRIPTION_PATH =
  "/dashboard/minha-empresa";

/**
 * Every action here is scoped to the CALLER's own clinic via
 * `getCurrentClinicId()` — there is no clinicId input anywhere in this
 * file, so a manipulated form field or URL cannot target another
 * company's subscription (PAY-002 tenant-isolation acceptance criterion).
 */
async function requireOwnGatewaySubscription() {
  await assertPermission(
    "clinic",
    "manage"
  );

  const clinicId =
    await getCurrentClinicId();

  const subscription =
    await prisma.clinicSubscription.findFirst(
      {
        where: {
          clinicId,
        },
        orderBy: {
          createdAt: "desc",
        },
      }
    );

  if (
    !subscription?.externalSubscriptionId ||
    subscription.providerKind === "MANUAL"
  ) {
    throw new Error(
      "Esta empresa ainda não tem uma assinatura vinculada ao provedor de cobrança."
    );
  }

  return { clinicId, subscription };
}

export async function startCompanyCheckoutAction() {
  const { clinicId, subscription } =
    await requireOwnGatewaySubscription();

  if (
    !subscription.externalCustomerId
  ) {
    throw new Error(
      "Cliente de cobrança não encontrado para esta empresa."
    );
  }

  const gateway = getBillingGateway();
  const session =
    await gateway.createCheckoutSession(
      {
        clinicId,
        externalCustomerId:
          subscription.externalCustomerId,
        successUrl: `${COMPANY_SUBSCRIPTION_PATH}?tab=subscription&checkout=success`,
        cancelUrl: `${COMPANY_SUBSCRIPTION_PATH}?tab=subscription&checkout=canceled`,
      }
    );

  redirect(session.url);
}

export async function openCompanyPortalAction() {
  const { subscription } =
    await requireOwnGatewaySubscription();

  if (
    !subscription.externalCustomerId
  ) {
    throw new Error(
      "Cliente de cobrança não encontrado para esta empresa."
    );
  }

  const gateway = getBillingGateway();
  const session =
    await gateway.createPortalSession({
      externalCustomerId:
        subscription.externalCustomerId,
      returnUrl: `${COMPANY_SUBSCRIPTION_PATH}?tab=subscription`,
    });

  redirect(session.url);
}

export async function pauseCompanySubscriptionAction() {
  const { clinicId, subscription } =
    await requireOwnGatewaySubscription();

  if (
    subscription.status !==
      ClinicSubscriptionStatus.ACTIVE &&
    subscription.status !==
      ClinicSubscriptionStatus.TRIAL
  ) {
    throw new Error(
      "Só é possível pausar uma assinatura ativa ou em teste."
    );
  }

  const gateway = getBillingGateway();
  const live =
    await gateway.pauseSubscription(
      subscription.externalSubscriptionId!
    );
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
  await createAuditLog(prisma, {
    clinicId,
    actor: actor.displayName,
    actorUserId: actor.id,
    action:
      AuditAction.PAUSE_SUBSCRIPTION,
    entity:
      AuditEntity.CLINIC_SUBSCRIPTION,
    entityId: subscription.id,
    metadata: {
      requestedBy: "company_admin",
    },
  });

  safeRevalidatePath(
    COMPANY_SUBSCRIPTION_PATH
  );
}

export async function resumeCompanySubscriptionAction() {
  const { clinicId, subscription } =
    await requireOwnGatewaySubscription();

  if (
    subscription.status !==
    ClinicSubscriptionStatus.PAUSED
  ) {
    throw new Error(
      "Só é possível retomar uma assinatura pausada."
    );
  }

  const gateway = getBillingGateway();
  const live =
    await gateway.resumeSubscription(
      subscription.externalSubscriptionId!
    );
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
  await createAuditLog(prisma, {
    clinicId,
    actor: actor.displayName,
    actorUserId: actor.id,
    action:
      AuditAction.RESUME_SUBSCRIPTION,
    entity:
      AuditEntity.CLINIC_SUBSCRIPTION,
    entityId: subscription.id,
    metadata: {
      requestedBy: "company_admin",
    },
  });

  safeRevalidatePath(
    COMPANY_SUBSCRIPTION_PATH
  );
}

/**
 * Cancellation never surprises the customer (PAY-002): if the
 * subscription is actively billing, we only flag `cancelAtPeriodEnd` —
 * access and the current period stay intact, and the gateway is only
 * asked to cancel for real once the period ends (PAY-003 reconciliation).
 * A PAUSED subscription (not currently billing or operating) has no
 * "period" left to protect, so it cancels immediately.
 */
export async function requestCompanySubscriptionCancellationAction() {
  const { clinicId, subscription } =
    await requireOwnGatewaySubscription();

  if (
    subscription.status ===
    ClinicSubscriptionStatus.CANCELED
  ) {
    return;
  }

  const actor =
    await getCurrentAuditActor();

  if (
    subscription.status ===
    ClinicSubscriptionStatus.PAUSED
  ) {
    const gateway = getBillingGateway();
    const live =
      await gateway.cancelSubscription(
        subscription.externalSubscriptionId!
      );

    await syncClinicSubscriptionFromGateway(
      subscription.id,
      live,
      prisma,
      {
        actor: actor.displayName,
        actorUserId: actor.id,
      }
    );
  } else {
    await prisma.clinicSubscription.update(
      {
        where: {
          id: subscription.id,
        },
        data: {
          cancelAtPeriodEnd: true,
        },
      }
    );
  }

  await createAuditLog(prisma, {
    clinicId,
    actor: actor.displayName,
    actorUserId: actor.id,
    action:
      AuditAction.CANCEL_SUBSCRIPTION,
    entity:
      AuditEntity.CLINIC_SUBSCRIPTION,
    entityId: subscription.id,
    metadata: {
      requestedBy: "company_admin",
      effectiveAt:
        subscription.status ===
        ClinicSubscriptionStatus.PAUSED
          ? "immediate"
          : (subscription.expiresAt?.toISOString() ??
            null),
    },
  });

  safeRevalidatePath(
    COMPANY_SUBSCRIPTION_PATH
  );
}

export async function undoCompanySubscriptionCancellationAction() {
  const { clinicId, subscription } =
    await requireOwnGatewaySubscription();

  if (!subscription.cancelAtPeriodEnd) {
    return;
  }

  await prisma.clinicSubscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      cancelAtPeriodEnd: false,
    },
  });

  const actor =
    await getCurrentAuditActor();

  await createAuditLog(prisma, {
    clinicId,
    actor: actor.displayName,
    actorUserId: actor.id,
    action: AuditAction.UPDATE,
    entity:
      AuditEntity.CLINIC_SUBSCRIPTION,
    entityId: subscription.id,
    metadata: {
      cancelAtPeriodEnd: false,
      requestedBy: "company_admin",
    },
  });

  safeRevalidatePath(
    COMPANY_SUBSCRIPTION_PATH
  );
}
