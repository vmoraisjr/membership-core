import { z } from "zod";

export const benefitUsageSchema = z.object({
  subscriptionId: z
    .string()
    .min(1, "Subscription is required."),
  membershipBenefitId: z
    .string()
    .min(1, "Benefit is required."),
  quantity: z.preprocess(
    (value) => {
      if (
        value === "" ||
        value == null
      ) {
        return 1;
      }

      return Number(value);
    },
    z
      .number()
      .int()
      .min(1, "Quantity must be at least 1.")
  ),
  usedBy: z
    .string()
    .trim()
    .min(2, "Used by is required."),
  notes: z.string().optional(),
});

export type BenefitUsageSchema = z.infer<typeof benefitUsageSchema>;
