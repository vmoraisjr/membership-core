import { ClinicContractStatus } from "@prisma/client";
import { z } from "zod";

export const clinicContractStatusSchema =
  z.object({
    contractId: z
      .string()
      .min(1, "Contract is required."),
    status: z.nativeEnum(
      ClinicContractStatus
    ),
  });

export const clinicContractFileReferenceSchema =
  z.object({
    contractId: z
      .string()
      .min(1, "Contract is required."),
    fileName: z
      .string()
      .trim()
      .min(3, "File name is required."),
    fileUrl: z
      .string()
      .trim()
      .url("File URL must be valid."),
  });

export type ClinicContractStatusSchema =
  z.infer<
    typeof clinicContractStatusSchema
  >;

export type ClinicContractFileReferenceSchema =
  z.infer<
    typeof clinicContractFileReferenceSchema
  >;
