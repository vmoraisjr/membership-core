import { PatientStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getActivePatients() {
  const clinic = await getCurrentClinic();

  return prisma.patient.count({
    where: {
      clinicId: clinic.id,
      status: PatientStatus.ACTIVE,
    },
  });
}
