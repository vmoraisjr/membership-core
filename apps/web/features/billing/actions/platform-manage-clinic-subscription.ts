"use server";

import {
  ClinicSubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import {
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  syncClinicSubscriptionStatusFromInvoice,
  updateClinicSubscriptionStatus,
} from "../services/billing-foundation";

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
      "Apenas owner ou administrador da plataforma podem administrar os planos das clinicas."
    );
  }
}

function revalidatePlatformBillingPaths(
  clinicId?: string
) {
  safeRevalidatePath("/dashboard/billing");
  safeRevalidatePath(
    "/dashboard/billing/catalog"
  );
  safeRevalidatePath(
    "/dashboard/billing/subscriptions"
  );
  safeRevalidatePath(
    "/dashboard/billing/payments"
  );
  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/dashboard/empresas");

  if (clinicId) {
    safeRevalidatePath(
      `/dashboard/empresas/${clinicId}`
    );
  }
}

export async function platformUpdateClinicSubscriptionStatusAction(
  formData: FormData
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  assertPlatformOwner(currentUser);

  const actor =
    await getCurrentAuditActor();
  const clinicId = String(
    formData.get("clinicId") ?? ""
  );
  const subscriptionId = String(
    formData.get("subscriptionId") ?? ""
  );
  const status = String(
    formData.get("status") ?? ""
  ) as ClinicSubscriptionStatus;
  const trialEndsAtRaw = String(
    formData.get("trialEndsAt") ?? ""
  );
  const trialEndsAt = trialEndsAtRaw
    ? new Date(`${trialEndsAtRaw}T00:00:00`)
    : undefined;

  if (
    status ===
      ClinicSubscriptionStatus.TRIAL &&
    (!trialEndsAt ||
      Number.isNaN(trialEndsAt.getTime()))
  ) {
    throw new Error(
      "Informe a data de encerramento do período de testes."
    );
  }

  const targetSubscription =
    await prisma.clinicSubscription.findUnique(
      {
        where: {
          id: subscriptionId,
        },
        select: {
          providerKind: true,
        },
      }
    );

  if (
    targetSubscription?.providerKind !==
    "MANUAL"
  ) {
    throw new Error(
      "Esta assinatura está vinculada a um provedor de cobrança — mudanças de status manuais poderiam contradizer o provedor. Use \"Solicitar sincronização\" para aplicar o estado real, ou reenvie o cliente ao checkout/portal."
    );
  }

  await updateClinicSubscriptionStatus(
    {
      clinicId,
      subscriptionId,
      status,
      trialEndsAt,
    },
    undefined,
    {
      actor: actor.displayName,
      actorUserId: actor.id,
    }
  );

  revalidatePlatformBillingPaths(clinicId);
}

export async function platformMarkClinicInvoicePaidAction(
  formData: FormData
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  assertPlatformOwner(currentUser);

  const actor =
    await getCurrentAuditActor();
  const invoiceId = String(
    formData.get("invoiceId") ?? ""
  );
  const invoice =
    await prisma.clinicInvoice.findUnique({
      where: {
        id: invoiceId,
      },
      select: {
        id: true,
        clinicId: true,
        amount: true,
        status: true,
        clinicSubscription: {
          select: {
            providerKind: true,
          },
        },
      },
    });

  if (!invoice) {
    throw new Error(
      "Clinic invoice not found."
    );
  }

  if (
    invoice.clinicSubscription
      .providerKind !== "MANUAL"
  ) {
    throw new Error(
      "Esta fatura está vinculada a um provedor de cobrança — use \"Solicitar sincronização\" ou reenvie o cliente ao checkout/portal em vez de marcar como paga manualmente sem evidência do provedor."
    );
  }

  if (invoice.status === PaymentStatus.PAID) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      const paidAt = new Date();
      await tx.clinicInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status: PaymentStatus.PAID,
          paidAt,
        },
      });

      const existingPayment =
        await tx.clinicPayment.findFirst({
          where: {
            clinicInvoiceId: invoice.id,
            status: PaymentStatus.PAID,
          },
          select: {
            id: true,
          },
        });

      if (!existingPayment) {
        await tx.clinicPayment.create({
          data: {
            clinicId: invoice.clinicId,
            clinicInvoiceId: invoice.id,
            amount: invoice.amount,
            status: PaymentStatus.PAID,
            paidAt,
            confirmedByUserId: actor.id,
          },
        });
      }

      await syncClinicSubscriptionStatusFromInvoice(
        invoice.id,
        PaymentStatus.PAID,
        tx
      );
    }
  );

  revalidatePlatformBillingPaths(
    invoice.clinicId
  );
}

export async function platformMarkClinicInvoiceOverdueAction(
  formData: FormData
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  assertPlatformOwner(currentUser);

  const invoiceId = String(
    formData.get("invoiceId") ?? ""
  );
  const invoice =
    await prisma.clinicInvoice.findUnique({
      where: {
        id: invoiceId,
      },
      select: {
        id: true,
        clinicId: true,
        clinicSubscription: {
          select: {
            providerKind: true,
          },
        },
      },
    });

  if (!invoice) {
    throw new Error(
      "Clinic invoice not found."
    );
  }

  if (
    invoice.clinicSubscription
      .providerKind !== "MANUAL"
  ) {
    throw new Error(
      "Esta fatura está vinculada a um provedor de cobrança — o status é conciliado automaticamente pelos webhooks."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.clinicInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status: PaymentStatus.OVERDUE,
        },
      });

      await syncClinicSubscriptionStatusFromInvoice(
        invoice.id,
        PaymentStatus.OVERDUE,
        tx
      );
    }
  );

  revalidatePlatformBillingPaths(
    invoice.clinicId
  );
}

export async function platformAssignClinicBillingPlanAction(
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
  const clinicBillingPlanId = String(
    formData.get("clinicBillingPlanId") ?? ""
  );

  const updated =
    await prisma.clinicSubscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        clinicBillingPlanId,
        status:
          ClinicSubscriptionStatus.PENDING,
      },
      select: {
        clinicId: true,
      },
    });

  revalidatePlatformBillingPaths(
    updated.clinicId
  );
}
