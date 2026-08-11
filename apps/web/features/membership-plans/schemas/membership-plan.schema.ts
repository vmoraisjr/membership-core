import { z } from "zod";

export const membershipPlanSchema = z.object({
  name: z
    .string()
    .min(3, "Name must contain at least 3 characters"),

  description: z.string().optional(),

  monthlyPrice: z.coerce.number().min(0),

  annualPrice: z.preprocess(
    (value) =>
      typeof value === "string" &&
      value.trim() === ""
        ? undefined
        : value,
    z.coerce.number().min(0).optional()
  ),
});

export type MembershipPlanSchema = z.infer<
  typeof membershipPlanSchema
>;