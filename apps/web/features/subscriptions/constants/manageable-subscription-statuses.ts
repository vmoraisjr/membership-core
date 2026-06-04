import { SubscriptionStatus } from "@prisma/client";

export const MANAGEABLE_SUBSCRIPTION_STATUSES: ReadonlyArray<SubscriptionStatus> =
  [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAUSED,
    SubscriptionStatus.PENDING,
    SubscriptionStatus.OVERDUE,
    SubscriptionStatus.EXPIRED,
  ];
