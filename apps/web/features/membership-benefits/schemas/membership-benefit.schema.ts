import {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";
import { z } from "zod";

function optionalNumber() {
  return z.preprocess((value) => {
    if (value === "" || value == null) {
      return undefined;
    }

    return Number(value);
  }, z.number().nonnegative().optional());
}

export const membershipBenefitSchema =
  z
    .object({
      membershipPlanId: z
        .string()
        .min(1, "Membership plan is required"),
      type: z.nativeEnum(BenefitType),
      title: z
        .string()
        .min(3, "Title is required"),
      description: z.string().optional(),
      discountPercentage:
        optionalNumber(),
      discountAmount:
        optionalNumber(),
      usageLimit: z.preprocess(
        (value) => {
          if (
            value === "" ||
            value == null
          ) {
            return undefined;
          }

          return Number(value);
        },
        z.number().int().min(0).optional()
      ),
      resetPeriod: z
        .nativeEnum(ResetPeriod)
        .optional()
        .or(z.literal("")),
    })
    .superRefine((data, ctx) => {
      if (
        data.type ===
          BenefitType.PERCENTAGE_DISCOUNT &&
        data.discountPercentage == null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            "discountPercentage",
          ],
          message:
            "Percentage discount is required for this benefit type.",
        });
      }

      if (
        data.type ===
          BenefitType.FIXED_DISCOUNT &&
        data.discountAmount == null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountAmount"],
          message:
            "Fixed discount amount is required for this benefit type.",
        });
      }

      if (
        data.type === BenefitType.LIMITED &&
        data.usageLimit == null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["usageLimit"],
          message:
            "Usage limit is required for limited benefits.",
        });
      }
    });

export type MembershipBenefitSchema = z.infer<
  typeof membershipBenefitSchema
>;
