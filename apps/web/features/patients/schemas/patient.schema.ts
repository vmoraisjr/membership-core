import { PatientKind } from "@prisma/client";
import { z } from "zod";

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCpf(value: string) {
  const digits =
    normalizeDigits(value);

  if (
    digits.length !== 11 ||
    /^(\d)\1{10}$/.test(digits)
  ) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum +=
      Number(digits[index]) *
      (10 - index);
  }

  let remainder =
    (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (
    remainder !== Number(digits[9])
  ) {
    return false;
  }

  sum = 0;
  for (
    let index = 0;
    index < 10;
    index += 1
  ) {
    sum +=
      Number(digits[index]) *
      (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return (
    remainder === Number(digits[10])
  );
}

export const patientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do paciente."),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido."),

  phone: z
    .string()
    .trim()
    .refine(
      (value) => {
        const digits =
          normalizeDigits(value);
        return (
          digits.length === 10 ||
          digits.length === 11
        );
      },
      "Informe um telefone com DDD válido."
    ),

  birthDate: z
    .string()
    .refine(
      (value) =>
        !Number.isNaN(
          new Date(value).getTime()
        ),
      "Informe uma data de nascimento válida."
    ),

  document: z
    .string()
    .trim()
    .refine(
      (value) => isValidCpf(value),
      "Informe um CPF válido."
    ),

  zipCode: z
    .string()
    .trim()
    .refine(
      (value) =>
        normalizeDigits(value).length ===
        8,
      "Informe um CEP válido."
    ),

  city: z
    .string()
    .trim()
    .min(2, "Informe a cidade."),

  state: z
    .string()
    .trim()
    .transform((value) =>
      value.toUpperCase()
    )
    .refine(
      (value) =>
        BRAZILIAN_STATES.includes(
          value as (typeof BRAZILIAN_STATES)[number]
        ),
      "Informe uma UF válida."
    ),

  address: z
    .string()
    .trim()
    .min(5, "Informe o endereço."),
  kind: z
    .nativeEnum(PatientKind)
    .optional()
    .default(PatientKind.TITULAR),
  responsibleDocument: z
    .string()
    .trim()
    .optional(),
}).superRefine((data, ctx) => {
  const birthDate = new Date(
    data.birthDate
  );
  const age =
    Number.isNaN(birthDate.getTime())
      ? 18
      : Math.max(
          0,
          new Date().getFullYear() -
            birthDate.getFullYear()
        );

  if (
    data.kind ===
      PatientKind.DEPENDENT &&
    !data.responsibleDocument
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["responsibleDocument"],
      message:
        "Informe o documento do responsável.",
    });
  }

  if (
    age < 18 &&
    data.kind !==
      PatientKind.DEPENDENT
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["kind"],
      message:
        "Paciente menor de idade precisa estar vinculado como dependente.",
    });
  }
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

export type PatientSchema = z.input<
  typeof patientSchema
>;

export type PatientDeactivationSchema =
  z.infer<
    typeof patientDeactivationSchema
  >;
