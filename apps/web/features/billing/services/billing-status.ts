import { PaymentStatus } from "@prisma/client";

export function canMarkInvoicePaid(
  status: PaymentStatus
) {
  return (
    status === PaymentStatus.PENDING ||
    status === PaymentStatus.OVERDUE
  );
}

export function canMarkInvoiceOverdue(
  status: PaymentStatus
) {
  return status === PaymentStatus.PENDING;
}

export function isFinalizedInvoiceStatus(
  status: PaymentStatus
) {
  return (
    status === PaymentStatus.CANCELED ||
    status === PaymentStatus.FAILED ||
    status === PaymentStatus.REFUNDED
  );
}
