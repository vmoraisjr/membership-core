"use client";

import { SubscriptionStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<
  SubscriptionStatus,
  string
> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  PENDING: "Pending",
  OVERDUE: "Overdue",
  CANCELED: "Canceled",
  EXPIRED: "Expired",
};

const STATUS_STYLES: Record<
  SubscriptionStatus,
  string
> = {
  ACTIVE:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAUSED:
    "border-amber-200 bg-amber-50 text-amber-700",
  PENDING:
    "border-slate-200 bg-slate-100 text-slate-700",
  OVERDUE:
    "border-orange-200 bg-orange-50 text-orange-700",
  CANCELED:
    "border-rose-200 bg-rose-50 text-rose-700",
  EXPIRED:
    "border-zinc-200 bg-zinc-100 text-zinc-700",
};

type Props = {
  status: SubscriptionStatus;
};

export function SubscriptionStatusBadge({
  status,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
