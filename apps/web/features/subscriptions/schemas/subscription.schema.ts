import { z } from "zod";

export const subscriptionSchema =
  z.object({
    patientId: z.string(),

    membershipPlanId: z.string(),

    startedAt: z.string(),

    expiresAt: z.string(),
  });

export type SubscriptionSchema =
  z.infer<typeof subscriptionSchema>;