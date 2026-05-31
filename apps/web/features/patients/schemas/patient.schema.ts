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

export const patientDeactivationSchema =
  z.object({
    inactiveReason: z
      .string()
      .trim()
      .min(
        3,
        "Deactivation reason is required"
      ),
  });

export type PatientSchema = z.infer<
  typeof patientSchema
>;

export type PatientDeactivationSchema =
  z.infer<
    typeof patientDeactivationSchema
  >;
