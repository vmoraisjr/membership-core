import { prisma } from "@/lib/prisma";

export async function getPatients() {
  return prisma.patient.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}