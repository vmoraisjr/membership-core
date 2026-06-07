import { PatientContractStatus } from "@prisma/client";
import { z } from "zod";

export const patientContractStatusSchema =
  z.object({
    contractId: z
      .string()
      .min(1, "Contract is required."),
    status: z.nativeEnum(
      PatientContractStatus
    ),
  });

export type PatientContractStatusSchema =
  z.infer<
    typeof patientContractStatusSchema
  >;
