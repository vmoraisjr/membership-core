<<<<<<< HEAD
import {
  SubscriptionStatus,
} from "@prisma/client";
import { z } from "zod";

export const subscriptionSchema = z.object({
  patientId: z
    .string()
    .min(1, "Patient is required"),
  membershipPlanId: z
    .string()
    .min(1, "Membership plan is required"),
  status: z.nativeEnum(
    SubscriptionStatus
  ),
  startedAt: z
    .string()
    .min(1, "Start date is required"),
  expiresAt: z
    .string()
    .optional(),
});

export type SubscriptionSchema = z.infer<
  typeof subscriptionSchema
>;
=======
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
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
