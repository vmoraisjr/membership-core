import { z } from "zod";

export const clinicSubscriptionLifecycleSchema =
  z.object({
    subscriptionId: z
      .string()
      .trim()
      .min(1),
    status: z.enum([
      "ACTIVE",
      "SUSPENDED",
      "CANCELED",
    ]),
  });

export type ClinicSubscriptionLifecycleInput =
  z.infer<
    typeof clinicSubscriptionLifecycleSchema
  >;
