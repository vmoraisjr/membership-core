import { z } from "zod";

export const patientSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name is required"),

  email: z
    .string()
    .email("Invalid email"),

  phone: z.string(),

  birthDate: z.string(),

  document: z.string(),

  zipCode: z.string(),

  city: z.string(),

  state: z.string(),

  address: z.string(),
});

export type PatientSchema = z.infer<
  typeof patientSchema
>;