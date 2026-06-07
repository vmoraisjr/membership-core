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
  canMarkInvoicePaid,
  isFinalizedInvoiceStatus,
} from "../services/billing-status";

export async function markPatientInvoicePaidAction(
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
        clinicId: true,
        amount: true,
        status: true,
        paidAt: true,
      },
    });

  if (!invoice) {
    throw new Error(
      "Patient invoice not found."
    );
  }

  if (
    invoice.status ===
    PaymentStatus.PAID
  ) {
    return;
  }

  if (
    isFinalizedInvoiceStatus(
      invoice.status
    ) ||
    !canMarkInvoicePaid(
      invoice.status
    )
  ) {
    throw new Error(
      "Only pending or overdue patient invoices can be marked as paid."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const paidAt = new Date();

      await tx.patientInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status: PaymentStatus.PAID,
          paidAt,
        },
      });
      const existingPayment =
        await tx.patientPayment.findFirst({
          where: {
            patientInvoiceId:
              invoice.id,
            status: PaymentStatus.PAID,
          },
          select: {
            id: true,
          },
        });

      if (!existingPayment) {
        await tx.patientPayment.create({
          data: {
            clinicId: clinic.id,
            patientInvoiceId:
              invoice.id,
            amount: invoice.amount,
            status: PaymentStatus.PAID,
            paidAt,
            confirmedByUserId:
              actor.id,
          },
        });
      }

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.MARK_INVOICE_PAID,
        entity:
          AuditEntity.PATIENT_INVOICE,
        entityId: invoice.id,
        entityLabel: invoice.id,
        metadata: {
          previousStatus:
            invoice.status,
          nextStatus:
            PaymentStatus.PAID,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/billing"
  );
  safeRevalidatePath("/dashboard");
}
