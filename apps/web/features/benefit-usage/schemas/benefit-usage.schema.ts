import { z } from "zod";

export const benefitUsageSchema = z.object({
  subscriptionId: z.string().cuid("Invalid subscription ID"),
  membershipBenefitId: z.string().cuid("Invalid benefit ID"),
  usedBy: z.string().min(1, "Used by is required"),
  notes: z.string().optional(),
});

export type BenefitUsageSchema = z.infer<typeof benefitUsageSchema>;
