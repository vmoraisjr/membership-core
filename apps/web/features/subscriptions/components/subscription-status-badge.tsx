"use client";

import { SubscriptionStatus } from "@prisma/client";

import { getTranslations } from "@/i18n/messages";
import {
  StatusIndicator,
  type StatusTone,
} from "@/components/ui/status-indicator";

const STATUS_TONES: Record<
  SubscriptionStatus,
  StatusTone
> = {
  ACTIVE: "success",
  PAUSED: "warning",
  PENDING: "neutral",
  OVERDUE: "warning",
  CANCELED: "danger",
  EXPIRED: "neutral",
};

type Props = {
  status: SubscriptionStatus;
};

export function SubscriptionStatusBadge({
  status,
}: Props) {
  const t = getTranslations();

  return (
    <StatusIndicator
      tone={STATUS_TONES[status]}
      label={t(
        `subscriptions.statuses.${status}`
      )}
    />
  );
}
