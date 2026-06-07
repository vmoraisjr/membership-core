import { ContractType } from "@prisma/client";
import { z } from "zod";

export const contractTemplateSchema =
  z.object({
    templateId: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
    type: z.nativeEnum(ContractType),
    title: z
      .string()
      .trim()
      .min(3, "Title is required."),
    content: z
      .string()
      .trim()
      .min(20, "Contract content is required."),
  });

export type ContractTemplateSchema =
  z.infer<
    typeof contractTemplateSchema
  >;

export const contractTemplateStateSchema =
  z.object({
    templateId: z
      .string()
      .min(1, "Template is required."),
  });
