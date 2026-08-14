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

import {
  canCancelInvoice,
  isFinalizedInvoiceStatus,
} from "../services/billing-status";

export async function cancelPatientInvoiceAction(
  formData: FormData
) {
  await assertPermission(
    "billing",
    "manage"
  );

  const invoiceId = String(
    formData.get("invoiceId") ?? ""
  );
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
        status: true,
      },
    });

  if (!invoice) {
    throw new Error(
      "Patient invoice not found."
    );
  }

  if (
    invoice.status ===
    PaymentStatus.CANCELED
  ) {
    return;
  }

  if (
    isFinalizedInvoiceStatus(
      invoice.status
    ) ||
    !canCancelInvoice(
      invoice.status
    )
  ) {
    throw new Error(
      "Only pending or overdue patient invoices can be canceled."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.patientInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status:
            PaymentStatus.CANCELED,
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
          previousStatus:
            invoice.status,
          nextStatus:
            PaymentStatus.CANCELED,
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
  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/dashboard/cobrancas");
  safeRevalidatePath("/dashboard/clientes");
}
