import {
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

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

export function canCancelInvoice(
  status: PaymentStatus
) {
  return (
    status === PaymentStatus.PENDING ||
    status === PaymentStatus.OVERDUE
  );
}

export function isPaymentMethod(
  value: string
): value is PaymentMethod {
  return Object.values(
    PaymentMethod
  ).includes(
    value as PaymentMethod
  );
}
