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

function revalidatePlatformBillingPaths() {
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

  await updateClinicSubscriptionStatus(
    {
      clinicId,
      subscriptionId,
      status,
    },
    undefined,
    {
      actor: actor.displayName,
      actorUserId: actor.id,
    }
  );

  revalidatePlatformBillingPaths();
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
      },
    });

  if (!invoice) {
    throw new Error(
      "Clinic invoice not found."
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

  revalidatePlatformBillingPaths();
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
      },
    });

  if (!invoice) {
    throw new Error(
      "Clinic invoice not found."
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

  revalidatePlatformBillingPaths();
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

  await prisma.clinicSubscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      clinicBillingPlanId,
      status:
        ClinicSubscriptionStatus.PENDING,
    },
  });

  revalidatePlatformBillingPaths();
}
