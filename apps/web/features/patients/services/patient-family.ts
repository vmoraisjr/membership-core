import { PatientKind } from "@prisma/client";

import prisma from "@/lib/prisma";
import { normalizeDigits } from "./patient-family-utils";

export {
  getPatientAge,
  isMinorPatient,
  normalizeDigits,
} from "./patient-family-utils";

export async function findResponsiblePatientByDocument(
  clinicId: string,
  document: string
) {
  const normalizedDocument =
    normalizeDigits(document);

  if (!normalizedDocument) {
    return null;
  }

  const candidates =
    await prisma.patient.findMany({
    where: {
      clinicId,
      kind: PatientKind.TITULAR,
      status: "ACTIVE",
    },
    select: {
      id: true,
      fullName: true,
      document: true,
      kind: true,
      status: true,
    },
  });

  return (
    candidates.find(
      (candidate) =>
        normalizeDigits(
          candidate.document
        ) === normalizedDocument
    ) ?? null
  );
}
