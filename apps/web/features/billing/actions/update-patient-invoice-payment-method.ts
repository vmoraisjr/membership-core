"use server";

import {
  AuditAction,
  AuditEntity,
  PaymentStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { isPaymentMethod } from "../services/billing-status";

export async function updatePatientInvoicePaymentMethodAction(
  formData: FormData
) {
  await assertPermission(
    "billing",
    "manage"
  );

  const invoiceId = String(
    formData.get("invoiceId") ?? ""
  );
  const paymentMethodValue = String(
    formData.get(
      "paymentMethod"
    ) ?? ""
  ).trim();

  if (
    !isPaymentMethod(
      paymentMethodValue
    )
  ) {
    throw new Error(
      "Invalid payment method."
    );
  }

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const invoice =
    await prisma.patientInvoice.findFirst({
      where: {
        id: invoiceId,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        paymentMethod: true,
      },
    });

  if (!invoice) {
    throw new Error(
      "Patient invoice not found."
    );
  }

  if (
    invoice.paymentMethod ===
    paymentMethodValue
  ) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.patientInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          paymentMethod:
            paymentMethodValue,
        },
      });

      await tx.patientPayment.updateMany({
        where: {
          patientInvoiceId:
            invoice.id,
          status:
            PaymentStatus.PAID,
        },
        data: {
          paymentMethod:
            paymentMethodValue,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity:
          AuditEntity.PATIENT_INVOICE,
        entityId: invoice.id,
        entityLabel: invoice.id,
        metadata: {
          previousPaymentMethod:
            invoice.paymentMethod,
          nextPaymentMethod:
            paymentMethodValue,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/billing"
  );
  safeRevalidatePath(
    "/dashboard/payments"
  );
  safeRevalidatePath("/dashboard/cobrancas");
  safeRevalidatePath("/dashboard/clientes");
}
