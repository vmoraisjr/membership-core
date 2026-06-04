import { z } from "zod";

export const clinicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Clinic name is required."),
  brandName: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .trim()
    .min(3, "Slug is required.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must use lowercase letters, numbers, and hyphens only."
    ),
  document: z
    .string()
    .trim()
    .min(3, "Document is required."),
  email: z
    .string()
    .trim()
    .email("Invalid email."),
  phone: z
    .string()
    .trim()
    .min(3, "Phone is required."),
  zipCode: z
    .string()
    .trim()
    .min(3, "ZIP code is required."),
  city: z
    .string()
    .trim()
    .min(2, "City is required."),
  state: z
    .string()
    .trim()
    .min(2, "State is required."),
  address: z
    .string()
    .trim()
    .min(3, "Address is required."),
});

export type ClinicSchema = z.infer<
  typeof clinicSchema
>;
