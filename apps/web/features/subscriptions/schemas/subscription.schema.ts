import { z } from "zod";

export const subscriptionSchema =
  z.object({
    patientId: z.string().min(1, "Patient is required."),

    membershipPlanId: z.string().min(1, "Membership plan is required."),

    startedAt: z.string().min(1, "Start date is required."),

    expiresAt: z.string().min(1, "Expiration date is required."),
  }).refine(
    (data) =>
      new Date(data.expiresAt).getTime() >=
      new Date(data.startedAt).getTime(),
    {
      message:
        "Expiration date must be on or after the start date.",
      path: ["expiresAt"],
    }
  );

export type SubscriptionSchema =
  z.infer<typeof subscriptionSchema>;