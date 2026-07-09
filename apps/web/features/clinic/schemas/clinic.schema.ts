import { z } from "zod";

import {
  isAllowedBrandingLogoSource,
  isValidBrazilianCnpj,
  isKnownBrazilianCityStatePair,
  MAX_BRANDING_LOGO_DATA_URL_LENGTH,
  MAX_BRANDING_NAME_LENGTH,
  isValidBrazilianPhone,
  isValidBrazilianState,
  isValidBrazilianZipCode,
} from "../services/clinic-formats";

export const clinicBrandingSchema =
  z.object({
    brandName: z
      .string()
      .trim()
      .max(
        MAX_BRANDING_NAME_LENGTH,
        `Use ate ${MAX_BRANDING_NAME_LENGTH} caracteres no nome de exibicao.`
      )
      .optional()
      .or(z.literal("")),
    logoUrl: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) =>
          isAllowedBrandingLogoSource(
            value ?? ""
          ),
        "Use um logo SVG ou PNG."
      )
      .refine(
        (value) =>
          !value ||
          !value.startsWith("data:") ||
          value.length <=
            MAX_BRANDING_LOGO_DATA_URL_LENGTH,
        "O logo enviado esta muito grande. Use um arquivo menor."
      ),
  });

export const clinicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome da clínica."),
  brandName:
    clinicBrandingSchema.shape.brandName,
  logoUrl:
    clinicBrandingSchema.shape.logoUrl,
  slug: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) =>
        !value ||
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
          value
        ),
      "Use apenas letras minúsculas, números e hífens no slug."
    ),
  document: z
    .string()
    .trim()
    .refine(
      (value) =>
        isValidBrazilianCnpj(value),
      "Informe um CNPJ válido."
    ),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido."),
  phone: z
    .string()
    .trim()
    .refine(
      (value) =>
        isValidBrazilianPhone(value),
      "Informe um telefone válido com DDD."
    ),
  zipCode: z
    .string()
    .trim()
    .refine(
      (value) =>
        isValidBrazilianZipCode(value),
      "Informe um CEP válido no formato 00000-000."
    ),
  city: z
    .string()
    .trim()
    .min(2, "Informe a cidade."),
  state: z
    .string()
    .trim()
    .min(2, "Informe o estado.")
    .refine(
      (value) =>
        isValidBrazilianState(value),
      "Informe uma UF brasileira válida."
    ),
  address: z
    .string()
    .trim()
    .min(3, "Informe o endereço."),
}).refine(
  (value) =>
    isKnownBrazilianCityStatePair(
      value.city,
      value.state
    ),
  {
    path: ["city"],
    message:
      "Selecione uma cidade compatível com a UF informada.",
  }
);

export type ClinicSchema = z.infer<
  typeof clinicSchema
>;

export type ClinicBrandingSchema =
  z.infer<
    typeof clinicBrandingSchema
  >;
