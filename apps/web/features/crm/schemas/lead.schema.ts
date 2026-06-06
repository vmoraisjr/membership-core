import { z } from "zod";

export const leadPipelineStatuses = [
  "NEW",
  "CONTACTED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const leadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name is required"),
  email: z
    .string()
    .trim()
    .email("Invalid email"),
  phone: z.string().trim(),
  birthDate: z.string(),
  document: z.string().trim(),
  zipCode: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  address: z.string().trim(),
  status: z.enum(leadPipelineStatuses),
  notes: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
});

export type LeadSchema = z.infer<
  typeof leadSchema
>;
