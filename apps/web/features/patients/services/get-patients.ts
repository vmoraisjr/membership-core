import { prisma } from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getPatients() {
  const clinic = await getCurrentClinic();

  return prisma.patient.findMany({
    where: {
      clinicId: clinic.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
