import {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";
import { z } from "zod";

export const benefitUsagePolicySchema =
  z.enum([
    "UNLIMITED",
    "MONTHLY",
    "TOTAL",
  ]);

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
      usagePolicy:
        benefitUsagePolicySchema.optional(),
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

      const usagePolicy =
        data.usagePolicy ??
        (data.resetPeriod ===
        ResetPeriod.MONTHLY
          ? "MONTHLY"
          : data.usageLimit != null
            ? "TOTAL"
            : "UNLIMITED");

      if (
        usagePolicy ===
          "UNLIMITED" &&
        data.usageLimit != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["usageLimit"],
          message:
            "Benefícios sem limite não devem informar quantidade de uso.",
        });
      }

      if (
        usagePolicy !==
          "UNLIMITED" &&
        (data.usageLimit == null ||
          data.usageLimit < 1)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["usageLimit"],
          message:
            "Informe uma quantidade de uso maior que zero.",
        });
      }

      if (
        usagePolicy ===
          "MONTHLY" &&
        data.resetPeriod !==
          ResetPeriod.MONTHLY
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["usagePolicy"],
          message:
            "A política mensal precisa renovar mensalmente.",
        });
      }
    });

export type MembershipBenefitSchema = z.infer<
  typeof membershipBenefitSchema
>;
