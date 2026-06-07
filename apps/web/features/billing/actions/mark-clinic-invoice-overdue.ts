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

import { syncClinicSubscriptionStatusFromInvoice } from "../services/billing-foundation";
import {
  canMarkInvoiceOverdue,
  isFinalizedInvoiceStatus,
} from "../services/billing-status";

export async function markClinicInvoiceOverdueAction(
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
    await prisma.clinicInvoice.findFirst({
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
      "Clinic invoice not found."
    );
  }

  if (
    invoice.status ===
    PaymentStatus.OVERDUE
  ) {
    return;
  }

  if (
    isFinalizedInvoiceStatus(
      invoice.status
    ) ||
    !canMarkInvoiceOverdue(
      invoice.status
    )
  ) {
    throw new Error(
      "Only pending clinic invoices can be marked as overdue."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.clinicInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status:
            PaymentStatus.OVERDUE,
        },
      });

      await syncClinicSubscriptionStatusFromInvoice(
        invoice.id,
        PaymentStatus.OVERDUE,
        tx
      );

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.MARK_INVOICE_OVERDUE,
        entity:
          AuditEntity.CLINIC_INVOICE,
        entityId: invoice.id,
        entityLabel: invoice.id,
        metadata: {
          previousStatus:
            invoice.status,
          nextStatus:
            PaymentStatus.OVERDUE,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/billing"
  );
  safeRevalidatePath("/dashboard");
}
