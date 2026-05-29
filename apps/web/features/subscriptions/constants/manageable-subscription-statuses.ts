import { SubscriptionStatus } from "@prisma/client";

export const MANAGEABLE_SUBSCRIPTION_STATUSES =
  [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PENDING,
    SubscriptionStatus.OVERDUE,
  ] as const;
