import {
  ClinicStatus,
  ClinicSubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";

import type { StatusTone } from "@/components/ui/status-indicator";

export function getClinicStatusTone(
  status: ClinicStatus
): StatusTone {
  return status === ClinicStatus.ACTIVE
    ? "success"
    : "neutral";
}

export function getClinicSubscriptionStatusTone(
  status: ClinicSubscriptionStatus
): StatusTone {
  switch (status) {
    case ClinicSubscriptionStatus.ACTIVE:
      return "success";
    case ClinicSubscriptionStatus.TRIAL:
      return "info";
    case ClinicSubscriptionStatus.PENDING:
      return "neutral";
    case ClinicSubscriptionStatus.PAST_DUE:
      return "warning";
    case ClinicSubscriptionStatus.PAUSED:
      return "warning";
    case ClinicSubscriptionStatus.SUSPENDED:
    case ClinicSubscriptionStatus.CANCELED:
      return "danger";
    default:
      return "neutral";
  }
}

export function getPaymentStatusTone(
  status: PaymentStatus
): StatusTone {
  switch (status) {
    case PaymentStatus.PAID:
      return "success";
    case PaymentStatus.PENDING:
      return "neutral";
    case PaymentStatus.OVERDUE:
      return "warning";
    case PaymentStatus.CANCELED:
    case PaymentStatus.FAILED:
      return "danger";
    default:
      return "neutral";
  }
}
