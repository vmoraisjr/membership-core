"use server";

import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getBillingGateway } from "@/features/billing/gateway/get-billing-gateway";
import { fakeBillingGateway } from "@/features/billing/gateway/fake-billing-gateway";
import { syncClinicSubscriptionFromGateway } from "@/features/billing/services/billing-foundation";

async function requireOwnCheckoutSession(
  sessionId: string
) {
  const currentUser =
    await requireCurrentAppUser();
  const session =
    fakeBillingGateway.__getCheckoutSession(
      sessionId
    );

  if (!session) {
    throw new Error(
      "Sessão de checkout não encontrada."
    );
  }

  if (
    currentUser.clinicId !==
    session.clinicId
  ) {
    throw new Error(
      "Esta sessão de checkout pertence a outra empresa."
    );
  }

  return session;
}

async function syncSubscriptionForClinic(
  clinicId: string
) {
  const subscription =
    await prisma.clinicSubscription.findFirst(
      {
        where: {
          clinicId,
          externalSubscriptionId: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }
    );

  if (
    !subscription?.externalSubscriptionId
  ) {
    return;
  }

  const gateway = getBillingGateway();
  const live = await gateway.getSubscription(
    subscription.externalSubscriptionId
  );

  if (live) {
    await syncClinicSubscriptionFromGateway(
      subscription.id,
      live
    );
  }
}

export async function approveFakeCheckoutAction(
  formData: FormData
) {
  const sessionId = String(
    formData.get("sessionId") ?? ""
  );
  const session =
    await requireOwnCheckoutSession(
      sessionId
    );

  fakeBillingGateway.__completeCheckoutSession(
    sessionId
  );
  await syncSubscriptionForClinic(
    session.clinicId
  );

  redirect(session.successUrl);
}

export async function cancelFakeCheckoutAction(
  formData: FormData
) {
  const sessionId = String(
    formData.get("sessionId") ?? ""
  );
  const session =
    await requireOwnCheckoutSession(
      sessionId
    );

  fakeBillingGateway.__cancelCheckoutSession(
    sessionId
  );

  redirect(session.cancelUrl);
}
